import React, { useState, useEffect } from "react";
import { Download, PieChart, BarChart3, Layers, RefreshCw, FileCheck } from "lucide-react";
import TopItemsBarChart from "../components/TopItemsBarChart";
import HazardDonutChart from "../components/HazardDonutChart";
import { getTopItems, getHazardBreakdown, getKpis, getExportLedgerUrl } from "../api";

export default function AnalysisPage() {
  const [topItems, setTopItems] = useState([]);
  const [hazardDist, setHazardDist] = useState({});
  const [kpis, setKpis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalysisData = async () => {
    try {
      const [itemsRes, hazardRes, kpisRes] = await Promise.all([
        getTopItems(5),
        getHazardBreakdown(),
        getKpis()
      ]);
      setTopItems(itemsRes.items || []);
      setHazardDist(hazardRes.distribution || {});
      setKpis(kpisRes);
    } catch (err) {
      console.error("Error fetching analysis data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const handleExportLedger = () => {
    window.open(getExportLedgerUrl(), "_blank");
  };

  if (isLoading && !kpis) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: "8px" }} />
        <div>Loading compliance analytics...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header with Export Ledger Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Stream & Hazard Breakdown Analysis
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchAnalysisData} className="btn btn-secondary" style={{ padding: "8px 14px" }}>
            <RefreshCw size={14} /> Refresh Analytics
          </button>

        </div>
      </div>

      {/* Analytics Summary Stats Row */}
      {kpis && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div className="card" style={{ padding: "16px" }}>
            <span className="kpi-label">Audit Scope Total</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "4px" }}>{kpis.total_scans} items</div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Items Logged</span>
          </div>

          <div className="card" style={{ padding: "16px" }}>
            <span className="kpi-label">High-Risk Segregation</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--hazard-imm-solid)", marginTop: "4px" }}>
              {kpis.high_risk_count}
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Class I items</span>
          </div>

          <div className="card" style={{ padding: "16px" }}>
            <span className="kpi-label">Regulated Items</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--hazard-reg-solid)", marginTop: "4px" }}>
              {kpis.regulated_count}
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Class II items</span>
          </div>

          <div className="card" style={{ padding: "16px" }}>
            <span className="kpi-label">Low Risk Municipal Stream</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--hazard-low-solid)", marginTop: "4px" }}>
              {kpis.low_risk_count}
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Class III municipal waste</span>
          </div>
        </div>
      )}

      {/* Main Analysis Visualizations Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px" }}>
        {/* Top 5 Most Common Waste Items Volume Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart3 size={18} color="var(--accent-primary)" />
                Top 5 Most Common Waste Items
              </h3>
              <p className="card-subtitle">Volume ranking categorized by material stream and hazard status</p>
            </div>
          </div>
          <TopItemsBarChart items={topItems} />
        </div>

        {/* Dynamic Hazard Tier Breakdown Donut Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <PieChart size={18} color="var(--accent-primary)" />
                Hazard Tier Breakdown
              </h3>
              <p className="card-subtitle">Proportional distribution (Low Risk vs. Regulated vs. Immediate Hazard)</p>
            </div>
          </div>
          <HazardDonutChart distribution={hazardDist} />
        </div>
      </div>

      {/* Audit Export Info Banner */}
      <div className="card" style={{ backgroundColor: "#f0fdfa", borderColor: "#ccfbf1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FileCheck size={28} color="var(--accent-primary)" />
          <div>
            <h4 style={{ fontWeight: 600, fontSize: "0.95rem" }}>Regulatory Compliance Ledger Ready</h4>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              The complete audit trail includes precise GPS coordinates, tracking identifiers, timestamps, and certified facility assignments.
            </p>
          </div>
        </div>
        <button onClick={handleExportLedger} className="btn btn-primary" style={{ padding: "8px 16px" }}>
          <Download size={14} /> Download Ledger CSV
        </button>
      </div>
    </div>
  );
}
