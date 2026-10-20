import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import UserScannerPage from "./pages/UserScannerPage";
import DashboardPage from "./pages/DashboardPage";
import AnalysisPage from "./pages/AnalysisPage";
import SubmissionsLogPage from "./pages/SubmissionsLogPage";

export default function App() {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  const [currentRoute, setCurrentRoute] = useState(() => {
    const path = window.location.pathname;
    if (["/dashboard", "/analysis", "/submissions-log"].includes(path)) {
      return "/scan";
    }
    return "/scan";
  });

  // Keep route synced with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (isAdminUnlocked) {
        if (["/dashboard", "/analysis", "/submissions-log"].includes(path)) {
          setCurrentRoute(path);
        } else {
          setCurrentRoute("/dashboard");
        }
      } else {
        setCurrentRoute("/scan");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAdminUnlocked]);

  const navigateTo = (route) => {
    setCurrentRoute(route);
    window.history.pushState({}, "", route);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleAdminLock = () => {
    if (!isAdminUnlocked) {
      const pass = window.prompt("Enter Admin Passcode to unlock admin mode:", "admin123");
      if (pass === "admin123") {
        setIsAdminUnlocked(true);
        navigateTo("/dashboard");
      } else if (pass !== null) {
        alert("Invalid passcode.");
      }
    } else {
      setIsAdminUnlocked(false);
      navigateTo("/scan");
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        currentRoute={currentRoute}
        navigateTo={navigateTo}
        isAdminUnlocked={isAdminUnlocked}
        toggleAdminLock={toggleAdminLock}
      />

      {/* Main View Area */}
      <main className="main-content">
        {!isAdminUnlocked ? (
          /* Guest Features Only */
          <UserScannerPage onNavigateToLog={null} />
        ) : (
          /* Admin Features Only */
          <>
            {(currentRoute === "/dashboard" || currentRoute === "/scan") && (
              <DashboardPage
                onNavigateToScan={() => { }}
                onNavigateToLog={() => navigateTo("/submissions-log")}
              />
            )}
            {currentRoute === "/analysis" && <AnalysisPage />}
            {currentRoute === "/submissions-log" && <SubmissionsLogPage />}
          </>
        )}
      </main>

      {/* Minimal Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-color)",
          padding: "16px 24px",
          backgroundColor: "var(--bg-card)",
          marginTop: "auto"
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "0.75rem",
            color: "var(--text-muted)"
          }}
        >
          <div>
            <strong>WasteWise™ System</strong> — Automated Solid & E-Waste Classification Platform
          </div>
          <div>
            {isAdminUnlocked ? "Active Mode: Facility Administration & Audit" : "Active Mode: Citizen Optical Intake"}
          </div>
        </div>
      </footer>
    </div>
  );
}