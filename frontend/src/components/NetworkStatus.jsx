import React from "react";
import { Activity, Server, Database, Cpu, CheckCircle2 } from "lucide-react";

export default function NetworkStatus({ networkData }) {
  if (!networkData) return null;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} color="var(--accent-primary)" />
            Kiosk & Hub Network Health
          </h3>
          <p className="card-subtitle">Real-time status of distributed sorting nodes and AI inference pipeline</p>
        </div>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        <div style={{ padding: "12px", background: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            <Server size={14} />
            <span>GATEWAY STATUS</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#166534" }}>
            {networkData.gateway_status}
          </div>
        </div>

        <div style={{ padding: "12px", background: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            <Cpu size={14} />
            <span>INFERENCE LATENCY</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
            {networkData.api_latency_ms} ms (Edge Sync)
          </div>
        </div>

        <div style={{ padding: "12px", background: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            <Database size={14} />
            <span>SQLITE DATA PERSISTENCE</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#166534" }}>
            {networkData.sqlite_db_status}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
          Active Facility Hub Connections
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
          {networkData.active_hubs && networkData.active_hubs.map((hub) => (
            <div
              key={hub.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
                fontSize: "0.8125rem",
                backgroundColor: "var(--bg-card)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16a34a" }} />
                <span style={{ fontWeight: 500 }}>{hub.name}</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Load: {hub.load}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
