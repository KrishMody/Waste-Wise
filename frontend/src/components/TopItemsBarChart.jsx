import React from "react";
import HazardBadge from "./HazardBadge";

export default function TopItemsBarChart({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
        No item volume data recorded yet.
      </div>
    );
  }

  const maxVolume = Math.max(...items.map((i) => i.volume), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {items.map((item, idx) => {
        const pct = Math.round((item.volume / maxVolume) * 100);
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {item.item_name}
                </span>
                <span className="badge badge-stream" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
                  {item.stream_type}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <HazardBadge tier={item.hazard_tier} size="sm" showIcon={false} />
                <span style={{ fontWeight: 700, color: "var(--text-primary)", minWidth: "28px", textAlign: "right" }}>
                  {item.volume}
                </span>
              </div>
            </div>

            {/* Bar Track */}
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "4px",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  backgroundColor:
                    item.hazard_tier === "Immediate Hazard"
                      ? "var(--hazard-imm-solid)"
                      : item.hazard_tier === "Regulated"
                      ? "var(--hazard-reg-solid)"
                      : "var(--hazard-low-solid)",
                  borderRadius: "4px",
                  transition: "width 0.4s ease"
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
