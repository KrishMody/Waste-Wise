import React from "react";

export default function HazardDonutChart({ distribution = {} }) {
  const immediate = distribution["Immediate Hazard"] || 0;
  const regulated = distribution["Regulated"] || 0;
  const lowRisk = distribution["Low Risk"] || 0;
  const total = immediate + regulated + lowRisk;

  if (total === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
        No hazard tier data recorded yet.
      </div>
    );
  }

  const immPct = Math.round((immediate / total) * 100);
  const regPct = Math.round((regulated / total) * 100);
  const lowPct = Math.round((lowRisk / total) * 100);

  // SVG Donut calculation with strokeDasharray and strokeDashoffset
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const immStroke = (immediate / total) * circumference;
  const regStroke = (regulated / total) * circumference;
  const lowStroke = (lowRisk / total) * circumference;

  const immOffset = 0;
  const regOffset = -immStroke;
  const lowOffset = -(immStroke + regStroke);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          {/* Low Risk Segment */}
          {lowRisk > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--hazard-low-solid)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${lowStroke} ${circumference}`}
              strokeDashoffset={lowOffset}
            />
          )}

          {/* Regulated Segment */}
          {regulated > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--hazard-reg-solid)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${regStroke} ${circumference}`}
              strokeDashoffset={regOffset}
            />
          )}

          {/* Immediate Hazard Segment */}
          {immediate > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--hazard-imm-solid)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${immStroke} ${circumference}`}
              strokeDashoffset={immOffset}
            />
          )}
        </svg>

        {/* Center Total Count */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none"
          }}
        >
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {total}
          </span>
          <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>
            Total Items
          </span>
        </div>
      </div>

      {/* Legend & Percentages */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8125rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--hazard-imm-solid)" }} />
            <span style={{ fontWeight: 500 }}>Immediate Hazard (Class I)</span>
          </div>
          <span style={{ fontWeight: 700, color: "var(--hazard-imm-text)" }}>
            {immediate} ({immPct}%)
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8125rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--hazard-reg-solid)" }} />
            <span style={{ fontWeight: 500 }}>Regulated Waste (Class II)</span>
          </div>
          <span style={{ fontWeight: 700, color: "var(--hazard-reg-text)" }}>
            {regulated} ({regPct}%)
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8125rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--hazard-low-solid)" }} />
            <span style={{ fontWeight: 500 }}>Low Risk (Class III)</span>
          </div>
          <span style={{ fontWeight: 700, color: "var(--hazard-low-text)" }}>
            {lowRisk} ({lowPct}%)
          </span>
        </div>
      </div>
    </div>
  );
}
