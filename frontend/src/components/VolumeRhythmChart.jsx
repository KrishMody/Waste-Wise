import React from "react";

export default function VolumeRhythmChart({ rhythm = [] }) {
  if (!rhythm || rhythm.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
        No volume rhythm data available for the past 24 hours.
      </div>
    );
  }

  const maxTotal = Math.max(...rhythm.map((r) => r.total), 1);
  const height = 180;
  const width = 600;
  const barWidth = width / rhythm.length - 4;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Aggregated scan throughput per hour (Past 24 Hours)
        </div>
        <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", fontWeight: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "var(--hazard-imm-solid)" }} />
            Immediate Hazard
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "var(--hazard-reg-solid)" }} />
            Regulated
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "var(--hazard-low-solid)" }} />
            Low Risk
          </div>
        </div>
      </div>

      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height + 30}`} style={{ width: "100%", height: "auto", minWidth: "500px" }}>
          {/* Background Grid Lines */}
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1={height} x2={width} y2={height} stroke="#e2e8f0" strokeWidth="1" />

          {/* Stacked Bars per Hour */}
          {rhythm.map((item, idx) => {
            const x = idx * (width / rhythm.length) + 2;
            const totalH = (item.total / maxTotal) * (height - 20);
            
            // Proportional heights
            const immH = item.total > 0 ? (item.immediate / item.total) * totalH : 0;
            const regH = item.total > 0 ? (item.regulated / item.total) * totalH : 0;
            const lowH = item.total > 0 ? (item.low_risk / item.total) * totalH : 0;

            const yLow = height - lowH;
            const yReg = yLow - regH;
            const yImm = yReg - immH;

            // Only show every 4th label on x-axis
            const showLabel = idx % 4 === 0 || idx === rhythm.length - 1;

            return (
              <g key={idx} className="rhythm-bar-group">
                <title>{`${item.hour} - Total: ${item.total} (Immediate: ${item.immediate}, Regulated: ${item.regulated}, Low Risk: ${item.low_risk})`}</title>
                
                {/* Background column hover guide */}
                <rect x={x} y="0" width={barWidth} height={height} fill="transparent" />

                {/* Low Risk Segment */}
                {lowH > 0 && (
                  <rect x={x} y={yLow} width={barWidth} height={lowH} fill="var(--hazard-low-solid)" rx="1" />
                )}
                
                {/* Regulated Segment */}
                {regH > 0 && (
                  <rect x={x} y={yReg} width={barWidth} height={regH} fill="var(--hazard-reg-solid)" rx="1" />
                )}

                {/* Immediate Hazard Segment */}
                {immH > 0 && (
                  <rect x={x} y={yImm} width={barWidth} height={immH} fill="var(--hazard-imm-solid)" rx="1" />
                )}

                {/* Empty marker if 0 */}
                {item.total === 0 && (
                  <rect x={x} y={height - 2} width={barWidth} height="2" fill="#cbd5e1" />
                )}

                {/* X Axis Label */}
                {showLabel && (
                  <text
                    x={x + barWidth / 2}
                    y={height + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                    fontFamily="inherit"
                  >
                    {item.hour}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
