import sqlite3
import os
import math
import uuid
from datetime import datetime, timedelta, timezone
import random
from datetime import datetime, timedelta, timezone
DB_PATH = os.path.join(os.path.dirname(__file__), "wastewise.db")
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great-circle distance in kilometers between two points on Earth."""
    R = 6371.0 # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS facilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accepted_tiers TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        operating_hours TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracking_code TEXT UNIQUE NOT NULL,
        item_name TEXT NOT NULL,
        stream_type TEXT NOT NULL,
        hazard_tier TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        user_lat REAL,
        user_lng REAL,
        closest_facility_id INTEGER,
        distance_km REAL,
        image_url TEXT,
        timestamp TEXT NOT NULL,
        status TEXT NOT NULL,
        disposal_instructions TEXT,
        hazard_rationale TEXT,
        notes TEXT,
        FOREIGN KEY (closest_facility_id) REFERENCES facilities (id)
    )
    """)

    # Seed facilities if empty
    cursor.execute("SELECT COUNT(*) as count FROM facilities")
    if cursor.fetchone()["count"] == 0:
        seed_facilities = [
    (
        "Kanjurmarg Integrated Solid Waste Management Project",
        19.1350,
        72.9378,
        "Low Risk,Regulated",
        "Off Eastern Express Highway, near Bhandup Pumping Station, Kanjurmarg East, Mumbai, MH 400042",
        "+91 (22) 2262-0251",
        "Mon-Sat: 07:00 - 19:00"
    ),
    (
        "Deonar Waste-to-Energy & Biomining Facility",
        19.0560,
        72.9230,
        "Low Risk,Regulated",
        "Ghatkopar–Mankhurd Link Road, Govandi East, Chembur, Mumbai, MH 400043",
        "+91 (22) 2555-8100",
        "Daily: 24 Hours (Intake)"
    ),
    (
        "Mulund Material Recovery & Biomining Facility",
        19.1670,
        72.9640,
        "Low Risk,Regulated",
        "Hari Om Nagar, Near Navghar, Mulund East, Mumbai, MH 400081",
        "+91 (22) 2564-5289",
        "Mon-Sat: 08:00 - 18:00"
    ),
    (
        "Gorai Scientific Leachate & Processing Depot",
        19.2390,
        72.8250,
        "Low Risk",
        "Gorai Creek Road, Near Fish Market, Borivali West, Mumbai, MH 400091",
        "+91 (22) 2894-6000",
        "Mon-Fri: 09:00 - 17:30"
    ),
    (
        "Mumbai Waste Management Limited (MWML Taloja)",
        19.0435,
        73.1238,
        "Immediate Hazard,Regulated",
        "Plot No. P-32, MIDC Taloja, Navi Mumbai / MMR, MH 410208",
        "+91 (22) 2741-2351",
        "Mon-Sat: 08:30 - 18:30"
    )
]
        cursor.executemany("""
        INSERT INTO facilities (name, latitude, longitude, accepted_tiers, address, phone, operating_hours)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, seed_facilities)

    # Seed initial dynamic submissions if empty so dashboard has rich initial state
    cursor.execute("SELECT COUNT(*) as count FROM submissions")
    if cursor.fetchone()["count"] == 0:
        seed_items = [
            ("Lithium-Ion Battery Pack", "E-Waste", "Immediate Hazard", 0.96, "Terminal thermal runaway risk. Store in fire-retardant sand container.", "Chemical cell with volatile electrolyte.", 1),
            ("PET Plastic Beverage Bottle", "Recyclable", "Low Risk", 0.98, "Rinse residue and place into designated municipal blue bin.", "Inert thermoplastic polymer.", 3),
            ("Printed Circuit Board (PCB)", "E-Waste", "Regulated", 0.92, "Deliver to certified e-waste recovery depot. Heavy metal recovery required.", "Contains lead solder and trace heavy metals.", 5),
            ("Lead-Acid Automotive Battery", "E-Waste", "Immediate Hazard", 0.99, "Hazardous sulfuric acid & lead content. Transport upright to certified vault.", "Highly toxic corrosive electrolyte and toxic heavy lead.", 2),
            ("Cardboard Packaging Box", "Recyclable", "Low Risk", 0.97, "Flatten and keep dry. Place in clean paper stream.", "Uncoated cellulose fiber.", 3),
            ("Intact ATX Power Supply Unit", "E-Waste", "Regulated", 0.91, "Discharge capacitors safely. Route to specialized metal/component scrapper.", "High-voltage capacitors and transformer coils.", 1),
            ("Organic Food Waste Compost", "Organic", "Low Risk", 0.95, "Divert to municipal anaerobic digestion or brown bin compost.", "Biodegradable organic material.", 4),
            ("Swollen Phone Battery", "E-Waste", "Immediate Hazard", 0.97, "Puncture danger! Isolate immediately in vermiculite fire bag.", "Pressurized lithium pouch cell prone to ignition.", 2),
            ("Aluminum Beverage Can", "Recyclable", "Low Risk", 0.99, "Empty liquid and crush. Infinitely recyclable metal.", "Pure aluminum alloy.", 3),
            ("Non-Recyclable Multilayer Film", "Non-Recyclable", "Low Risk", 0.89, "Dispose in general residual municipal waste for thermal recovery.", "Bonded polymers unsuitable for mechanical recycling.", 3),
            ("Industrial Soldered Motherboard", "E-Waste", "Regulated", 0.93, "Deposit in certified WEEE collection container.", "Integrated microchips, tantalum capacitors, solder.", 5),
            ("Damaged Lithium Polymer Cell", "E-Waste", "Immediate Hazard", 0.98, "Critical thermal risk. Do not compress or expose to moisture.", "Exposed lithium polymer matrix.", 2),
            ("Glass Food Jar", "Recyclable", "Low Risk", 0.96, "Rinse and place in municipal glass stream.", "Inert silica glass.", 3),
            ("CRT Monitor Glass Tube", "E-Waste", "Regulated", 0.94, "Leaded funnel glass requires specialized vacuum hazardous handling.", "High lead oxide concentration.", 1),
            ("Aerosol Spray Can (Residual Solvent)", "Non-Recyclable", "Regulated", 0.88, "Pressurized container with volatile propellant.", "Flammable propellant vapors.", 1)
        ]

        now = datetime.now(timezone.utc)
        base_lat, base_lng = 12.9716, 77.5946

        for i, (name, stream, tier, conf, inst, rat, fac_id) in enumerate(seed_items):
            # distribute timestamps across the last 24 hours
            hours_ago = random.uniform(0.5, 23.5)
            ts = (now - timedelta(hours=hours_ago)).isoformat()
            code = f"WW-{uuid.uuid4().hex[:8].upper()}"
            u_lat = base_lat + random.uniform(-0.06, 0.06)
            u_lng = base_lng + random.uniform(-0.06, 0.06)
            
            # get facility coords
            cursor.execute("SELECT latitude, longitude FROM facilities WHERE id = ?", (fac_id,))
            fac = cursor.fetchone()
            dist = haversine_distance(u_lat, u_lng, fac["latitude"], fac["longitude"]) if fac else 3.2

            cursor.execute("""
            INSERT INTO submissions (
                tracking_code, item_name, stream_type, hazard_tier, confidence_score,
                user_lat, user_lng, closest_facility_id, distance_km, image_url,
                timestamp, status, disposal_instructions, hazard_rationale, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                code, name, stream, tier, conf,
                u_lat, u_lng, fac_id, dist, None,
                ts, "Processed", inst, rat, "Standard intake scan"
            ))

    conn.commit()
    conn.close()

def get_closest_facilities(user_lat, user_lng, hazard_tier=None):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM facilities")
    facilities = cursor.fetchall()
    conn.close()

    result = []
    for f in facilities:
        dist = haversine_distance(user_lat, user_lng, f["latitude"], f["longitude"]) if (user_lat is not None and user_lng is not None) else 0.0
        tiers = [t.strip() for t in f["accepted_tiers"].split(",")]
        is_accepted = (hazard_tier is None) or (hazard_tier in tiers)
        result.append({
            "id": f["id"],
            "name": f["name"],
            "latitude": f["latitude"],
            "longitude": f["longitude"],
            "accepted_tiers": tiers,
            "address": f["address"],
            "phone": f["phone"],
            "operating_hours": f["operating_hours"],
            "distance_km": round(dist, 2),
            "is_certified_for_tier": is_accepted
        })

    # Sort primarily by certified status (True first), then by closest distance
    result.sort(key=lambda x: (not x["is_certified_for_tier"], x["distance_km"]))
    return result

def get_kpis():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM submissions")
    total_scans = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as high_risk FROM submissions WHERE hazard_tier = 'Immediate Hazard'")
    high_risk_count = cursor.fetchone()["high_risk"]

    cursor.execute("SELECT COUNT(*) as regulated FROM submissions WHERE hazard_tier = 'Regulated'")
    regulated_count = cursor.fetchone()["regulated"]

    cursor.execute("SELECT COUNT(*) as low_risk FROM submissions WHERE hazard_tier = 'Low Risk'")
    low_risk_count = cursor.fetchone()["low_risk"]

    cursor.execute("""
    SELECT stream_type, COUNT(*) as count 
    FROM submissions 
    GROUP BY stream_type 
    ORDER BY count DESC 
    LIMIT 1
    """)
    top_stream_row = cursor.fetchone()
    top_stream = top_stream_row["stream_type"] if top_stream_row else "N/A"
    top_stream_count = top_stream_row["count"] if top_stream_row else 0

    conn.close()

    high_risk_pct = round((high_risk_count / total_scans * 100), 1) if total_scans > 0 else 0.0

    return {
        "total_scans": total_scans,
        "high_risk_count": high_risk_count,
        "regulated_count": regulated_count,
        "low_risk_count": low_risk_count,
        "high_risk_percentage": high_risk_pct,
        "top_stream": top_stream,
        "top_stream_count": top_stream_count
    }

def get_volume_rhythm_24h():
    """
    Returns hour-by-hour intake volume for the past 24 hours converted to local time.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT timestamp, hazard_tier 
        FROM submissions 
        WHERE timestamp IS NOT NULL
    """)
    rows = cursor.fetchall()
    conn.close()

    # Generate 24 hourly buckets ending at the current local hour
    now_local = datetime.now()
    buckets = {}
    for i in range(23, -1, -1):
        slot_dt = now_local - timedelta(hours=i)
        slot_key = slot_dt.strftime("%H:00")
        buckets[slot_key] = {
            "time": slot_key,
            "Immediate Hazard": 0,
            "Regulated": 0,
            "Low Risk": 0,
            "total": 0
        }

    for row in rows:
        ts_str = row["timestamp"]
        tier = row["hazard_tier"]
        try:
            # Parse ISO UTC timestamp
            if ts_str.endswith("Z"):
                ts_str = ts_str[:-1] + "+00:00"
            dt_utc = datetime.fromisoformat(ts_str)
            # Convert UTC to local system time
            dt_local = dt_utc.astimezone()
            hour_key = dt_local.strftime("%H:00")

            if hour_key in buckets:
                if tier in buckets[hour_key]:
                    buckets[hour_key][tier] += 1
                elif tier == "Class I" or "Immediate" in str(tier):
                    buckets[hour_key]["Immediate Hazard"] += 1
                elif tier == "Class II" or "Regulated" in str(tier):
                    buckets[hour_key]["Regulated"] += 1
                else:
                    buckets[hour_key]["Low Risk"] += 1
                buckets[hour_key]["total"] += 1
        except Exception:
            continue

    return list(buckets.values())

def get_top_items(limit=5):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT item_name, stream_type, hazard_tier, COUNT(*) as volume
    FROM submissions
    GROUP BY item_name
    ORDER BY volume DESC
    LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_hazard_distribution():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        hazard_tier, 
        COUNT(*) as count
    FROM submissions
    GROUP BY hazard_tier
    """)
    rows = cursor.fetchall()
    conn.close()
    
    dist = {"Immediate Hazard": 0, "Regulated": 0, "Low Risk": 0}
    for r in rows:
        dist[r["hazard_tier"]] = r["count"]
    return dist

def get_recent_submissions(limit=10):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT s.*, f.name as facility_name, f.address as facility_address
    FROM submissions s
    LEFT JOIN facilities f ON s.closest_facility_id = f.id
    ORDER BY s.timestamp DESC
    LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_submissions_paginated(search="", tier="All", page=1, per_page=10):
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
    SELECT s.*, f.name as facility_name, f.address as facility_address
    FROM submissions s
    LEFT JOIN facilities f ON s.closest_facility_id = f.id
    WHERE 1=1
    """
    params = []
    
    if tier and tier != "All":
        query += " AND s.hazard_tier = ?"
        params.append(tier)
        
    if search and search.strip():
        term = f"%{search.strip()}%"
        query += " AND (s.item_name LIKE ? OR s.tracking_code LIKE ? OR s.stream_type LIKE ? OR f.name LIKE ?)"
        params.extend([term, term, term, term])
        
    # Count total
    count_query = f"SELECT COUNT(*) as total FROM ({query})"
    cursor.execute(count_query, params)
    total_records = cursor.fetchone()["total"]
    
    # Paginate
    query += " ORDER BY s.timestamp DESC LIMIT ? OFFSET ?"
    offset = (page - 1) * per_page
    params.extend([per_page, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    total_pages = math.ceil(total_records / per_page) if total_records > 0 else 1
    
    return {
        "items": [dict(r) for r in rows],
        "total": total_records,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

def delete_submission(submission_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM submissions WHERE id = ?", (submission_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
