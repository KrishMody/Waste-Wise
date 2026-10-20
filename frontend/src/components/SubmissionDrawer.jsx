import React from "react";
import { X, Trash2 } from "lucide-react";
import HazardBadge from "./HazardBadge";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function SubmissionDrawer({ submission, onClose, onDelete }) {
  if (!submission) return null;

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete submission record ${submission.tracking_code}? This will immediately recalculate all metrics and charts.`)) {
      await onDelete(submission.id);
      onClose();
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Submission Audit Detail
            </span>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {submission.tracking_code}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: "6px" }} aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        {/* Item Header Banner */}
        <div style={{ padding: "16px", backgroundColor: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{submission.item_name}</h4>
            <HazardBadge tier={submission.hazard_tier} />
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span className="badge badge-stream">{submission.stream_type} Stream</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Confidence: {Math.round(submission.confidence_score * 100)}%
            </span>
          </div>
        </div>

        {/* Uploaded Photo Preview */}
        {submission.image_url && (
          <div>
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "6px"
              }}
            >
              Ingested Optical Scan
            </label>
            <div
              style={{
                maxHeight: "200px",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid var(--border-color)"
              }}
            >
              <img
                src={
                  submission.image_url.startsWith("http")
                    ? submission.image_url
                    : `${BACKEND_URL}${submission.image_url}`
                }
                alt={submission.item_name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block"
                }}
              />
            </div>
          </div>
        )}

        {/* Hazard Rationale & Instructions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
              Statutory Hazard Rationale
            </label>
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "6px" }}>
              {submission.hazard_rationale || "Evaluated under standard statutory classification directives."}
            </p>
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
              Mandatory Handling & Disposal Instructions
            </label>
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px", borderRadius: "6px" }}>
              {submission.disposal_instructions || "Segregate and transfer to approved municipal collection container."}
            </p>
          </div>
        </div>

        {/* Logistics & Location Details */}
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Logistics & Routing
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8125rem" }}>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Timestamp</span>
              <span style={{ fontWeight: 600 }}>{new Date(submission.timestamp).toLocaleString()}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Proximity Distance</span>
              <span style={{ fontWeight: 600 }}>{submission.distance_km ? `${submission.distance_km} km` : "N/A"}</span>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Assigned Nearest Facility</span>
              <span style={{ fontWeight: 600 }}>{submission.facility_name || "Metro Certified Disposal Facility"}</span>
              {submission.facility_address && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {submission.facility_address}
                </div>
              )}
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Scan Coordinates</span>
              <span style={{ fontWeight: 500, fontSize: "0.75rem" }}>
                {submission.user_lat ? `${submission.user_lat.toFixed(4)}, ${submission.user_lng.toFixed(4)}` : "Default Urban Sector"}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Intake Status</span>
              <span className="badge" style={{ backgroundColor: "#f0fdf4", color: "#166534" }}>{submission.status || "Processed"}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--border-color)", display: "flex", gap: "10px" }}>
          <button onClick={handleDelete} className="btn btn-danger" style={{ flex: 1 }}>
            <Trash2 size={16} />
            Delete Record
          </button>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}