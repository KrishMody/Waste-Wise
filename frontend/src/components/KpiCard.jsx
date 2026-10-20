import React from "react";

export default function KpiCard({ label, value, subtext, icon, trend, highlightColor }) {
  return (
    <div
      className="kpi-card"
      style={{
        borderLeft: highlightColor ? `4px solid ${highlightColor}` : "1px solid var(--border-color)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="kpi-label">{label}</span>
        {icon && <div style={{ color: "var(--text-muted)" }}>{icon}</div>}
      </div>
      <div className="kpi-value">{value}</div>
      {subtext && (
        <div className="kpi-footer">
          {trend && (
            <span style={{ fontWeight: 600, color: trend.startsWith("+") ? "#b91c1c" : "#166534" }}>
              {trend}
            </span>
          )}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}
