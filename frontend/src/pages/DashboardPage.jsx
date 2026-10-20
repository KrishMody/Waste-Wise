import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertOctagon,
  ShieldCheck,
  TrendingUp,
  Clock,
  Layers,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import KpiCard from "../components/KpiCard";
import NetworkStatus from "../components/NetworkStatus";
import HazardBadge from "../components/HazardBadge";
import SubmissionDrawer from "../components/SubmissionDrawer";
import { getKpis, getVolumeRhythm, getNetworkStatus, getRecentSubmissions, deleteSubmission } from "../api";

// Tooltip definition for 24-hour rhythm chart
const CustomVolumeTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
    return (
      <div
        style={{
          backgroundColor: "#1e293b",
          color: "#f8fafc",
          padding: "10px 14px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontSize: "0.75rem",
          minWidth: "150px"
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: "6px", borderBottom: "1px solid #334155", paddingBottom: "4px" }}>
          Time Slot: {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: "10px", margin: "2px 0" }}>
            <span style={{ color: entry.fill, fontWeight: 600 }}>{entry.name}:</span>
            <span>{entry.value}</span>
          </div>
        ))}
        <div style={{ marginTop: "6px", paddingTop: "4px", borderTop: "1px solid #334155", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
          <span>Total:</span>
          <span>{total}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage({ onNavigateToScan, onNavigateToLog }) {
  const [kpis, setKpis] = useState(null);
  const [rhythm, setRhythm] = useState([]);
  const [network, setNetwork] = useState(null);
  const [recent, setRecent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [kpiData, rhythmData, networkData, recentData] = await Promise.all([
        getKpis(),
        getVolumeRhythm(),
        getNetworkStatus(),
        getRecentSubmissions(6)
      ]);
      setKpis(kpiData);
      setRhythm(rhythmData.rhythm || []);
      setNetwork(networkData);
      setRecent(recentData.submissions || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh feed and metrics every 15 seconds
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteSubmission = async (id) => {
    try {
      await deleteSubmission(id);
      await fetchDashboardData();
    } catch (err) {
      alert("Failed to delete record");
    }
  };

  if (isLoading && !kpis) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: "8px" }} />
        <div>Loading real-time operational dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Operational Command Dashboard
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Real-time telemetry and statutory hazard segregation oversight across intake points.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8125rem" }}>
            <RefreshCw size={14} /> Refresh Telemetry
          </button>

        </div>
      </div>

      {/* Dynamic KPI Summary Cards */}
      {kpis && (
        <div className="kpi-grid">
          <KpiCard
            label="Total Processed Scans"
            value={kpis.total_scans}
            subtext="Persisted in SQLite database"
            icon={<Layers size={20} />}
            highlightColor="var(--accent-primary)"
          />
          <KpiCard
            label="Immediate Hazard (Class I)"
            value={kpis.high_risk_count}
            subtext={`${kpis.high_risk_percentage}% of total waste streams`}
            icon={<AlertOctagon size={20} color="var(--hazard-imm-solid)" />}
            highlightColor="var(--hazard-imm-solid)"
          />
          <KpiCard
            label="Regulated Waste (Class II)"
            value={kpis.regulated_count}
            subtext="Heavy metals & electronic scrap"
            icon={<Clock size={20} color="var(--hazard-reg-solid)" />}
            highlightColor="var(--hazard-reg-solid)"
          />
          <KpiCard
            label="Dominant Item Stream"
            value={kpis.top_stream}
            subtext={`${kpis.top_stream_count} recorded items in stream`}
            icon={<TrendingUp size={20} color="#15803d" />}
            highlightColor="var(--hazard-low-solid)"
          />
        </div>
      )}

      {/* 24-Hour Classification Volume Rhythm */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>
              24-Hour Item Classification History
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Hourly distribution of scanned items by statutory hazard category (Local Time)
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "0.75rem", fontWeight: 600 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", backgroundColor: "#dc2626", borderRadius: "2px" }} />
              Immediate Hazard
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", backgroundColor: "#ea580c", borderRadius: "2px" }} />
              Regulated
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", backgroundColor: "#16a34a", borderRadius: "2px" }} />
              Low Risk
            </span>
          </div>
        </div>

        {/* Horizontally Scrollable Wrapper */}
        <div
          className="no-scrollbar"
          style={{
            width: "100%",
            overflowX: "auto",
            paddingBottom: "8px",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
        >
          <div style={{ minWidth: "950px", height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rhythm} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color, #e5e7eb)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "var(--text-secondary, #6b7280)" }}
                  axisLine={{ stroke: "var(--border-color, #e5e7eb)" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--text-secondary, #6b7280)" }}
                  axisLine={{ stroke: "var(--border-color, #e5e7eb)" }}
                  tickLine={false}
                />
                <Tooltip content={<CustomVolumeTooltip />} />
                <Bar dataKey="Low Risk" stackId="hazard" fill="#16a34a" radius={[0, 0, 0, 0]} barSize={24} />
                <Bar dataKey="Regulated" stackId="hazard" fill="#ea580c" radius={[0, 0, 0, 0]} barSize={24} />
                <Bar dataKey="Immediate Hazard" stackId="hazard" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Kiosk Network Health + Recent Submissions Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "24px" }}>
        {/* Network Status */}
        <NetworkStatus networkData={network} />

        {/* Live Auto-Refreshing Recent Feed */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={18} color="var(--accent-primary)" />
                Live Submissions Intake Feed
              </h3>
              <p className="card-subtitle">Auto-refreshing audit trail of recent intake scans</p>
            </div>
            <button
              onClick={onNavigateToLog}
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              Full Log <ChevronRight size={12} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recent.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No recent submissions found.
              </div>
            ) : (
              recent.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedSubmission(item)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-card)",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card)")}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{item.item_name}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.tracking_code}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {item.facility_name || "Regional Facility"}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <HazardBadge tier={item.hazard_tier} size="sm" />
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      {selectedSubmission && (
        <SubmissionDrawer
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onDelete={handleDeleteSubmission}
        />
      )}
    </div>
  );
}