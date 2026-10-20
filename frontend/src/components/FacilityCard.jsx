import React from "react";
import { MapPin, Phone, Clock, CheckCircle2, Navigation } from "lucide-react";
import HazardBadge from "./HazardBadge";

export default function FacilityCard({ facility, isNearest = false, targetTier }) {
  const isCertified = facility.accepted_tiers && (
    !targetTier || facility.accepted_tiers.includes(targetTier)
  );

  return (
    <div
      className="card"
      style={{
        borderColor: isNearest ? "var(--accent-primary)" : "var(--border-color)",
        borderWidth: isNearest ? "2px" : "1px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        backgroundColor: isNearest ? "#f0fdfa" : "var(--bg-card)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div>
          {isNearest && (
            <span
              style={{
                display: "inline-block",
                backgroundColor: "var(--accent-primary)",
                color: "#ffffff",
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px",
                marginBottom: "6px",
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}
            >
              Recommended Nearest Facility
            </span>
          )}
          <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
            {facility.name}
          </h4>
        </div>
        <div
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-color)",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <Navigation size={12} color="var(--accent-primary)" />
          {facility.distance_km !== undefined ? `${facility.distance_km} km` : "Nearby"}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
        <MapPin size={14} style={{ marginTop: "2px", flexShrink: 0, color: "var(--text-muted)" }} />
        <span>{facility.address}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
        {facility.operating_hours && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock size={12} />
            <span>{facility.operating_hours}</span>
          </div>
        )}
        {facility.phone && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Phone size={12} />
            <span>{facility.phone}</span>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", marginTop: "4px" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
          Certified Acceptance Tiers:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {facility.accepted_tiers && facility.accepted_tiers.map((tier, idx) => (
            <HazardBadge key={idx} tier={tier} size="sm" showIcon={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
