import React from "react";
import { Recycle, LayoutDashboard, PieChart, FileSpreadsheet, ScanLine, ShieldCheck, Lock, LogOut } from "lucide-react";

export default function Navbar({ currentRoute, navigateTo, isAdminUnlocked, toggleAdminLock }) {
  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            className="nav-brand"
            onClick={() => navigateTo(isAdminUnlocked ? "/dashboard" : "/scan")}
            style={{ cursor: "pointer" }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff"
              }}
            >
              <Recycle size={20} />
            </div>
            <div>
              <span>Waste</span>Wise
              <span
                style={{
                  display: "block",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: "-2px"
                }}
              >
                {isAdminUnlocked ? "Facility Administration" : "E-Waste Segregation"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Strict Mode Separation */}
        <nav className="nav-links">
          {!isAdminUnlocked ? (
            /* Guest-Only Navigation */
            <button
              onClick={() => navigateTo("/scan")}
              className={`nav-link ${currentRoute === "/scan" || currentRoute === "/" ? "active" : ""}`}
              style={{ border: "none", background: "none", cursor: "pointer" }}
            >
              <ScanLine size={16} />
              <span>Scanner</span>
            </button>
          ) : (
            /* Admin-Only Navigation */
            <>
              <button
                onClick={() => navigateTo("/dashboard")}
                className={`nav-link ${currentRoute === "/dashboard" ? "active" : ""}`}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => navigateTo("/analysis")}
                className={`nav-link ${currentRoute === "/analysis" ? "active" : ""}`}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                <PieChart size={16} />
                <span>Analysis</span>
              </button>
              <button
                onClick={() => navigateTo("/submissions-log")}
                className={`nav-link ${currentRoute === "/submissions-log" ? "active" : ""}`}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                <FileSpreadsheet size={16} />
                <span>Submissions Log</span>
              </button>
            </>
          )}
        </nav>

        {/* Mode Switcher / Auth Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={toggleAdminLock}
            className="btn btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "0.75rem",
              borderRadius: "20px",
              backgroundColor: isAdminUnlocked ? "#fef2f2" : "var(--bg-subtle)",
              borderColor: isAdminUnlocked ? "#fecaca" : "var(--border-color)",
              color: isAdminUnlocked ? "#991b1b" : "var(--text-secondary)"
            }}
            title={isAdminUnlocked ? "Exit Admin Mode" : "Authenticate as Facility Admin"}
          >
            {isAdminUnlocked ? (
              <>
                <LogOut size={14} />
                <span>Exit Admin Session</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>Admin Portal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}