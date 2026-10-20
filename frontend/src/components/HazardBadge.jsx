import React from "react";
import { AlertTriangle, ShieldCheck, AlertOctagon } from "lucide-react";

export default function HazardBadge({ tier, showIcon = true, size = "md" }) {
  let badgeClass = "badge-low";
  let icon = <ShieldCheck size={14} />;
  let label = "Class III • Low Risk";

  if (tier === "Immediate Hazard" || tier === "Class I") {
    badgeClass = "badge-immediate";
    icon = <AlertOctagon size={14} />;
    label = "Class I • Immediate Hazard";
  } else if (tier === "Regulated" || tier === "Class II") {
    badgeClass = "badge-regulated";
    icon = <AlertTriangle size={14} />;
    label = "Class II • Regulated Waste";
  }

  const paddingStyle = size === "sm" ? { padding: "2px 6px", fontSize: "0.7rem" } : {};

  return (
    <span className={`badge ${badgeClass}`} style={paddingStyle}>
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
}
