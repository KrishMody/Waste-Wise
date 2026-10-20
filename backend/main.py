import os
import uuid
import io
import csv
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from database import (
    init_db,
    get_db,
    get_closest_facilities,
    get_kpis,
    get_volume_rhythm_24h,
    get_top_items,
    get_hazard_distribution,
    get_recent_submissions,
    get_submissions_paginated,
    delete_submission,
    UPLOADS_DIR
)
from classifier import classify_waste_item

app = FastAPI(title="WasteWise API", version="1.0.0")

# Enable CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images statically
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health")
def health_check():
    return {"status": "operational", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/network-status")
def get_network_status():
    """Returns kiosk and hub network operational status indicators."""
    return {
        "gateway_status": "ONLINE",
        "api_latency_ms": 14,
        "inference_engine": "ACTIVE (ON-DEVICE & EDGE SYNC)",
        "sqlite_db_status": "CONNECTED",
        "active_hubs": [
            {"id": "HUB-01", "name": "Kanjurmarg Material Recovery Hub", "status": "Operational", "load": "42%"},
            {"id": "HUB-02", "name": "MWML Taloja Hazardous Vault", "status": "Operational", "load": "58%"},
            {"id": "HUB-03", "name": "Gorai Processing Node", "status": "Operational", "load": "29%"},
            {"id": "HUB-04", "name": "Deonar Intake & WtE Terminal", "status": "Operational", "load": "64%"}
        ]
    }

@app.post("/api/scan")
async def scan_waste_item(
    image: Optional[UploadFile] = File(None),
    item_hint: Optional[str] = Form(""),
    user_lat: Optional[float] = Form(None),
    user_lng: Optional[float] = Form(None)
):
    """
    Ingests waste photo/camera capture, classifies it into statutory hazard tiers,
    persists submission to SQLite, and returns sorted closest facilities.
    """
    image_url = None
    original_filename = ""
    contents = None
    if image and image.filename:
        original_filename = image.filename
        ext = os.path.splitext(image.filename)[1] or ".jpg"
        file_id = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOADS_DIR, file_id)
        
        contents = await image.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        image_url = f"/uploads/{file_id}"

    # Perform AI classification
    classification = classify_waste_item(
        hint_text=item_hint or "",
        filename=original_filename,
        image_bytes=contents
    )

    # Calculate distance to certified disposal facilities
    # If user didn't allow GPS, default to Mumbai baseline
    effective_lat = user_lat if user_lat is not None else 19.0760
    effective_lng = user_lng if user_lng is not None else 72.8777
    
    facilities = get_closest_facilities(effective_lat, effective_lng, classification["hazard_tier"])
    closest_fac = facilities[0] if facilities else None
    closest_fac_id = closest_fac["id"] if closest_fac else None
    distance_km = closest_fac["distance_km"] if closest_fac else 0.0

    # Write directly to SQLite database
    tracking_code = f"WW-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO submissions (
        tracking_code, item_name, stream_type, hazard_tier, confidence_score,
        user_lat, user_lng, closest_facility_id, distance_km, image_url,
        timestamp, status, disposal_instructions, hazard_rationale, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tracking_code,
        classification["item_name"],
        classification["stream_type"],
        classification["hazard_tier"],
        classification["confidence_score"],
        user_lat,
        user_lng,
        closest_fac_id,
        distance_km,
        image_url,
        now_iso,
        "Processed",
        classification["disposal_instructions"],
        classification["hazard_rationale"],
        f"Classified via Web Ingestion ({original_filename or 'Manual Capture'})"
    ))
    submission_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "submission_id": submission_id,
        "tracking_code": tracking_code,
        "item_name": classification["item_name"],
        "stream_type": classification["stream_type"],
        "hazard_tier": classification["hazard_tier"],
        "hazard_class": classification["hazard_class"],
        "confidence_score": classification["confidence_score"],
        "disposal_instructions": classification["disposal_instructions"],
        "hazard_rationale": classification["hazard_rationale"],
        "image_url": image_url,
        "box": classification.get("box"),  # <--- FORWARDS BOUNDING BOX TO FRONTEND
        "timestamp": now_iso,
        "closest_facility": closest_fac,
        "ranked_facilities": facilities
    }

@app.get("/api/facilities")
def list_facilities(lat: Optional[float] = Query(None), lng: Optional[float] = Query(None)):
    facilities = get_closest_facilities(lat, lng)
    return {"facilities": facilities}

@app.get("/api/kpis")
def get_dashboard_kpis():
    return get_kpis()

@app.get("/api/analytics/volume-rhythm")
def get_volume_rhythm():
    return {"rhythm": get_volume_rhythm_24h()}

@app.get("/api/analytics/top-items")
def get_top_items_data(limit: int = 5):
    return {"items": get_top_items(limit=limit)}

@app.get("/api/analytics/hazard-breakdown")
def get_hazard_breakdown():
    return {"distribution": get_hazard_distribution()}

@app.get("/api/submissions/recent")
def get_recent(limit: int = 10):
    return {"submissions": get_recent_submissions(limit=limit)}

@app.get("/api/submissions")
def list_submissions(
    search: str = Query("", description="Search item name, tracking code, stream, or facility"),
    tier: str = Query("All", description="Hazard tier filter: All, Immediate Hazard, Regulated, Low Risk"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100)
):
    return get_submissions_paginated(search=search, tier=tier, page=page, per_page=per_page)

@app.delete("/api/submissions/{submission_id}")
def remove_submission(submission_id: int):
    deleted = delete_submission(submission_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"success": True, "message": f"Submission {submission_id} deleted successfully"}

@app.get("/api/export-ledger")
def export_ledger():
    """Generates dynamic CSV export of entire verified disposal ledger."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT s.id, s.tracking_code, s.timestamp, s.item_name, s.stream_type, s.hazard_tier, 
           s.confidence_score, s.distance_km, s.status, f.name as facility_name, f.address as facility_address
    FROM submissions s
    LEFT JOIN facilities f ON s.closest_facility_id = f.id
    ORDER BY s.timestamp DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Tracking Code", "Timestamp (UTC)", "Item Name", "Stream Type", 
        "Hazard Tier", "Confidence Score", "Distance (km)", "Status", "Closest Facility", "Facility Address"
    ])
    
    for r in rows:
        writer.writerow([
            r["id"], r["tracking_code"], r["timestamp"], r["item_name"], r["stream_type"],
            r["hazard_tier"], r["confidence_score"], r["distance_km"], r["status"],
            r["facility_name"] or "N/A", r["facility_address"] or "N/A"
        ])
        
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=wastewise_audit_ledger_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )
