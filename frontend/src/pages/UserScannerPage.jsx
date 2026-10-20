import React, { useState, useEffect } from "react";
import { MapPin, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import ImageDropzone from "../components/ImageDropzone";
import HazardBadge from "../components/HazardBadge";
import FacilityCard from "../components/FacilityCard";
import { scanWasteItem } from "../api";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function UserScannerPage({ onNavigateToLog }) {
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [locationStatus, setLocationStatus] = useState("detecting"); // detecting | granted | denied | default
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scannedImagePreview, setScannedImagePreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [imgDims, setImgDims] = useState({ naturalWidth: 1, naturalHeight: 1, clientWidth: 1, clientHeight: 1 });

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    setLocationStatus("detecting");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationStatus("granted");
        },
        (err) => {
          console.warn("Geolocation permission not granted or timeout:", err.message);
          setCoords({ lat: 19.0760, lng: 72.8777 }); // Default to Mumbai baseline
          setLocationStatus("default");
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setCoords({ lat: 19.0760, lng: 72.8777 });
      setLocationStatus("default");
    }
  };

  const handleScan = async ({ file, itemHint }) => {
    setIsScanning(true);
    setErrorMsg(null);

    if (file) {
      setScannedImagePreview(URL.createObjectURL(file));
    } else {
      setScannedImagePreview(null);
    }

    try {
      const data = await scanWasteItem({
        file,
        itemHint,
        lat: coords.lat,
        lng: coords.lng
      });
      setScanResult(data);
    } catch (err) {
      setErrorMsg("Error processing waste classification. Please check network connection and try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Geolocation Notice Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "12px 16px",
          backgroundColor: locationStatus === "granted" ? "#f0fdf4" : "var(--bg-card)",
          border: `1px solid ${locationStatus === "granted" ? "#bbf7d0" : "var(--border-color)"}`,
          borderRadius: "8px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.875rem" }}>
          <MapPin size={18} color="var(--accent-primary)" />
          <div>
            <span style={{ fontWeight: 600 }}>
              {locationStatus === "granted"
                ? "Live GPS Location Active: "
                : locationStatus === "detecting"
                  ? "Acquiring Coordinates..."
                  : "Regional Depot Coordinates: "}
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
              {coords.lat ? `${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E` : "Detecting..."}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={requestLocation}
          className="btn btn-secondary"
          style={{ padding: "4px 10px", fontSize: "0.75rem" }}
        >
          <RefreshCw size={12} />
          Recalibrate GPS
        </button>
      </div>

      {/* Main Scanner Grid */}
      <div style={{ display: "grid", gridTemplateColumns: scanResult ? "1fr 1fr" : "1fr", gap: "24px" }}>
        {/* Left Column: Dropzone / Camera */}
        <div>
          <ImageDropzone onScan={handleScan} isScanning={isScanning} />
          {errorMsg && (
            <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", fontSize: "0.875rem" }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Right Column: AI Results & Detected Bounding Box */}
        {scanResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Visual Bounding Box Overlay Card */}
            {(scannedImagePreview || scanResult.image_url) && (
              <div className="card" style={{ padding: "16px", textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                    textAlign: "left"
                  }}
                >
                  Optical Detection Localization
                </div>

                {/* Ensure this wrapper is relative so absolute positioning targets the image */}
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    maxWidth: "100%",
                    borderRadius: "8px",
                    overflow: "hidden"
                  }}
                >
                  {/* 1. The onLoad handler MUST set natural vs client dimensions */}
                  <img
                    src={scannedImagePreview || `${BACKEND_URL}${scanResult.image_url}`}
                    alt="Detected Waste"
                    onLoad={(e) => {
                      setImgDims({
                        naturalWidth: e.target.naturalWidth || 1,
                        naturalHeight: e.target.naturalHeight || 1,
                        clientWidth: e.target.clientWidth || 1,
                        clientHeight: e.target.clientHeight || 1
                      });
                    }}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "260px",
                      objectFit: "contain",
                      display: "block",
                      margin: "0 auto"
                    }}
                  />

                  {/* 2. Your Bounding Box block with zIndex added so it sits above the image */}
                  {scanResult.box && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${(scanResult.box.x / imgDims.naturalWidth) * imgDims.clientWidth}px`,
                        top: `${(scanResult.box.y / imgDims.naturalHeight) * imgDims.clientHeight}px`,
                        width: `${(scanResult.box.width / imgDims.naturalWidth) * imgDims.clientWidth}px`,
                        height: `${(scanResult.box.height / imgDims.naturalHeight) * imgDims.clientHeight}px`,
                        border: "3px solid #16a34a",
                        backgroundColor: "rgba(22, 163, 74, 0.2)",
                        borderRadius: "4px",
                        boxShadow: "0 0 10px rgba(22, 163, 74, 0.7)",
                        pointerEvents: "none",
                        zIndex: 10
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          bottom: "100%",
                          left: "-3px",
                          backgroundColor: "#16a34a",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px 4px 0 0",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {scanResult.item_name} ({Math.round(scanResult.confidence_score * 100)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Classification & Statutory Guidance Card */}
            <div className="card" style={{ borderLeft: "4px solid var(--accent-primary)" }}>
              <div className="card-header">
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Verified Waste Classification
                  </span>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                    {scanResult.item_name}
                  </h2>
                </div>
                <HazardBadge tier={scanResult.hazard_tier} />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                <span className="badge badge-stream">{scanResult.stream_type} Stream</span>
                <span className="badge" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                  Tracking Code: {scanResult.tracking_code}
                </span>
                <span className="badge" style={{ backgroundColor: "#f0fdf4", color: "#166534" }}>
                  AI Confidence: {Math.round(scanResult.confidence_score * 100)}%
                </span>
              </div>

              {/* Statutory Hazard & Rationale */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Statutory Hazard Rationale:
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5, backgroundColor: "var(--bg-subtle)", padding: "10px", borderRadius: "6px" }}>
                  {scanResult.hazard_rationale}
                </p>
              </div>

              {/* Safe Disposal Directives */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Mandatory Safe Disposal Protocol:
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-primary)",
                    backgroundColor: scanResult.hazard_tier === "Immediate Hazard" ? "#fee2e2" : "#f0fdf4",
                    border: `1px solid ${scanResult.hazard_tier === "Immediate Hazard" ? "#fecaca" : "#bbf7d0"}`,
                    padding: "12px",
                    borderRadius: "6px",
                    lineHeight: 1.5,
                    fontWeight: 500
                  }}
                >
                  {scanResult.disposal_instructions}
                </div>
              </div>

              {/* Navigation Link */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Record committed directly to database ledger
                </span>
                {onNavigateToLog && (
                  <button
                    type="button"
                    onClick={onNavigateToLog}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                  >
                    View in Submissions Log
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Nearest Facility Card */}
            {scanResult.closest_facility && (
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                  Nearest Certified Disposal Facility
                </h3>
                <FacilityCard
                  facility={scanResult.closest_facility}
                  isNearest={true}
                  targetTier={scanResult.hazard_tier}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamically Ranked Facilities List */}
      {scanResult && scanResult.ranked_facilities && scanResult.ranked_facilities.length > 1 && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Certified Regional Facilities (Ranked by Haversine Distance)
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Calculated dynamically from your location ({coords.lat?.toFixed(4)}°, {coords.lng?.toFixed(4)}°) to certified recovery hubs.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {scanResult.ranked_facilities.slice(1).map((fac) => (
              <FacilityCard key={fac.id} facility={fac} targetTier={scanResult.hazard_tier} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}