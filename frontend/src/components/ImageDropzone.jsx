import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Camera, Sparkles, RefreshCw, X } from "lucide-react";

const SAMPLE_PRESETS = [
  { label: "Lithium Battery", hint: "Battery", filename: "battery.jpg" },
  { label: "PCB Circuit Board", hint: "PCB", filename: "pcb_board.jpg" },
  { label: "Smartphone", hint: "Smartphone", filename: "smartphone.jpg" },
  { label: "Laptop", hint: "Laptop", filename: "laptop.jpg" },
  { label: "CRT Monitor", hint: "CRT-Monitor", filename: "crt_monitor.jpg" },
  { label: "Refrigerator", hint: "Refrigerator", filename: "refrigerator.jpg" }
];

export default function ImageDropzone({ onScan, isScanning }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [itemHint, setItemHint] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Attach video stream as soon as <video> mounts into DOM
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn("Camera play interrupted:", err);
      });
    }
  }, [isCameraActive]);

  // Clean up camera stream if component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileChange = (file) => {
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    if (!itemHint) {
      setItemHint(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      alert("Camera access denied or device not found. Please upload a photo instead: " + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_scan_${Date.now()}.jpg`, { type: "image/jpeg" });
      handleFileChange(file);
      stopCamera();
    }, "image/jpeg", 0.95);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setItemHint("");
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onScan({ file: selectedFile, itemHint });
  };

  const handlePresetSelect = (preset) => {
    setItemHint(preset.hint);
    setSelectedFile(null);
    setPreviewUrl(null);
    onScan({ file: null, itemHint: preset.hint });
  };

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={20} color="var(--accent-primary)" />
          AI Waste Intake & Optical Scan
        </h3>
        <p className="card-subtitle">
          Upload an image, capture via camera, or select a sample waste stream to initiate statutory hazard analysis.
        </p>
      </div>

      {/* Quick sample chips */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
          Quick Test Waste Categories:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              disabled={isScanning}
              className="btn btn-secondary"
              style={{
                fontSize: "0.75rem",
                padding: "4px 10px",
                borderRadius: "6px",
                backgroundColor: itemHint === preset.hint ? "var(--accent-light)" : "var(--bg-subtle)"
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Live View (Smooth Accordion) */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: isCameraActive ? "1fr" : "0fr",
          opacity: isCameraActive ? 1 : 0,
          transition: "grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, margin-bottom 0.35s ease",
          marginBottom: isCameraActive ? "16px" : "0px"
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              maxWidth: "460px",
              margin: "0 auto",
              position: "relative",
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "#000",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)"
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                maxHeight: "320px",
                objectFit: "cover",
                display: "block"
              }}
            />

            {/* Snapshot / Cancel Controls Overlay */}
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "10px",
                zIndex: 10
              }}
            >
              <button
                type="button"
                onClick={capturePhoto}
                className="btn btn-primary"
                style={{
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Camera size={15} />
                Capture Snapshot
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="btn btn-secondary"
                style={{
                  padding: "8px 14px",
                  fontSize: "0.85rem",
                  backgroundColor: "rgba(255, 255, 255, 0.9)"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      {!isCameraActive && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            border: `2px dashed ${dragOver ? "var(--accent-primary)" : "var(--border-color)"}`,
            borderRadius: "12px",
            padding: "32px 16px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: dragOver ? "var(--accent-light)" : "var(--bg-subtle)",
            transition: "all 0.15s ease",
            marginBottom: "16px"
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
            accept="image/*"
            style={{ display: "none" }}
          />
          {previewUrl ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <img
                src={previewUrl}
                alt="Selected waste preview"
                style={{ maxHeight: "180px", maxWidth: "100%", borderRadius: "8px", objectFit: "cover" }}
              />
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                {selectedFile?.name} (Click or drag to replace)
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <UploadCloud size={24} color="var(--accent-primary)" />
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Click to upload waste photo
                </span>{" "}
                <span style={{ color: "var(--text-muted)" }}>or drag & drop</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                PNG, JPG, WEBP, or HEIC up to 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual hint input & Camera Toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          type="text"
          className="input"
          placeholder="Optional: Item name or description (e.g. Broken laptop battery, Milk carton)"
          value={itemHint}
          onChange={(e) => setItemHint(e.target.value)}
        />
        {!isCameraActive && (
          <button
            type="button"
            onClick={startCamera}
            className="btn btn-secondary"
            title="Use device camera"
            style={{ whiteSpace: "nowrap" }}
          >
            <Camera size={16} />
            Camera
          </button>
        )}
      </div>

      {/* Submit / Classify Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {selectedFile || itemHint ? (
          <button type="button" onClick={clearSelection} className="btn btn-secondary" style={{ fontSize: "0.8125rem" }}>
            <X size={14} /> Clear Selection
          </button>
        ) : <div />}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isScanning || (!selectedFile && !itemHint)}
          className="btn btn-primary"
          style={{ padding: "10px 24px", fontSize: "0.95rem" }}
        >
          {isScanning ? (
            <>
              <RefreshCw size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
              Analyzing Statutory Hazard...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Classify & Find Facilities
            </>
          )}
        </button>
      </div>
    </div>
  );
}