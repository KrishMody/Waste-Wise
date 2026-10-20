import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import HazardBadge from "../components/HazardBadge";
import SubmissionDrawer from "../components/SubmissionDrawer";
import { getSubmissions, deleteSubmission, getKpis, getExportLedgerUrl } from "../api";

export default function SubmissionsLogPage() {
  const [submissions, setSubmissions] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchLogData = async () => {
    setIsLoading(true);
    try {
      const [logData, kpiData] = await Promise.all([
        getSubmissions({
          search: searchTerm,
          tier: tierFilter,
          page,
          perPage: 10
        }),
        getKpis()
      ]);
      setSubmissions(logData.items || []);
      setTotal(logData.total || 0);
      setTotalPages(logData.total_pages || 1);
      setKpis(kpiData);
    } catch (err) {
      console.error("Error fetching submissions log:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogData();
  }, [page, tierFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLogData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async (id) => {
    try {
      await deleteSubmission(id);
      await fetchLogData();
    } catch (err) {
      alert("Failed to delete record: " + err.message);
    }
  };

  const handleExport = () => {
    window.open(getExportLedgerUrl(), "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Scanned Submissions & Audit Log
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Searchable statutory registry of all classified waste items and verified facility dispatches.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchLogData} className="btn btn-secondary" style={{ padding: "8px 14px" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExport} className="btn btn-primary" style={{ padding: "8px 16px" }}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Daily Intake Summary Metric Cards */}
      {kpis && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <div className="card" style={{ padding: "12px 16px" }}>
            <span className="kpi-label">Total Logged Items</span>
            <div style={{ fontSize: "1.35rem", fontWeight: 700 }}>{kpis.total_scans}</div>
          </div>
          <div className="card" style={{ padding: "12px 16px", borderLeft: "3px solid var(--hazard-imm-solid)" }}>
            <span className="kpi-label">Class I (Immediate)</span>
            <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--hazard-imm-solid)" }}>
              {kpis.high_risk_count}
            </div>
          </div>
          <div className="card" style={{ padding: "12px 16px", borderLeft: "3px solid var(--hazard-reg-solid)" }}>
            <span className="kpi-label">Class II (Regulated)</span>
            <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--hazard-reg-solid)" }}>
              {kpis.regulated_count}
            </div>
          </div>
          <div className="card" style={{ padding: "12px 16px", borderLeft: "3px solid var(--hazard-low-solid)" }}>
            <span className="kpi-label">Class III (Low Risk)</span>
            <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--hazard-low-solid)" }}>
              {kpis.low_risk_count}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar Controls */}
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          {/* Search Bar */}
          <div style={{ flex: "1 1 280px", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="input"
              placeholder="Search by item name, tracking code, stream, or facility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "36px" }}
            />
          </div>

          {/* Tier Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(1);
              }}
              className="input"
              style={{ width: "auto", minWidth: "180px", cursor: "pointer" }}
            >
              <option value="All">All Hazard Tiers</option>
              <option value="Immediate Hazard">Class I • Immediate Hazard</option>
              <option value="Regulated">Class II • Regulated Waste</option>
              <option value="Low Risk">Class III • Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Paginated Submissions Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Tracking ID</th>
              <th>Classified Item</th>
              <th>Stream</th>
              <th>Hazard Tier</th>
              <th>Assigned Facility</th>
              <th>Proximity</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: "8px" }} />
                  Updating audit table...
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  <AlertCircle size={20} style={{ display: "inline-block", marginRight: "8px", verticalAlign: "middle" }} />
                  No submissions matched your search or tier criteria.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub.id}>
                  <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {new Date(sub.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontFamily: "monospace", fontSize: "0.8125rem" }}>
                      {sub.tracking_code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{sub.item_name}</div>
                  </td>
                  <td>
                    <span className="badge badge-stream">{sub.stream_type}</span>
                  </td>
                  <td>
                    <HazardBadge tier={sub.hazard_tier} size="sm" />
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    {sub.facility_name || "Regional Recovery Depot"}
                  </td>
                  <td style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                    {sub.distance_km !== undefined ? `${sub.distance_km} km` : "N/A"}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className="btn btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        title="Inspect Detail Drawer"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete record ${sub.tracking_code}?`)) {
                            handleDelete(sub.id);
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "0.75rem", color: "#b91c1c" }}
                        title="Delete Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Showing {(page - 1) * 10 + (submissions.length > 0 ? 1 : 0)} - {(page - 1) * 10 + submissions.length} of {total} records
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="btn btn-secondary"
            style={{ padding: "6px 12px" }}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="btn btn-secondary"
            style={{ padding: "6px 12px" }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Slide-over Inspection Drawer */}
      {selectedSubmission && (
        <SubmissionDrawer
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
