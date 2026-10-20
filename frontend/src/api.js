const API_BASE = "http://127.0.0.1:8000/api";

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function getNetworkStatus() {
  const res = await fetch(`${API_BASE}/network-status`);
  return res.json();
}

export async function scanWasteItem({ file, itemHint, lat, lng }) {
  const formData = new FormData();
  if (file) {
    formData.append("image", file);
  }
  if (itemHint) {
    formData.append("item_hint", itemHint);
  }
  if (lat !== null && lat !== undefined) {
    formData.append("user_lat", lat.toString());
  }
  if (lng !== null && lng !== undefined) {
    formData.append("user_lng", lng.toString());
  }

  const res = await fetch(`${API_BASE}/scan`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    throw new Error("Failed to process waste scan");
  }
  return res.json();
}

export async function getKpis() {
  const res = await fetch(`${API_BASE}/kpis`);
  return res.json();
}

export async function getVolumeRhythm() {
  const res = await fetch(`${API_BASE}/analytics/volume-rhythm`);
  return res.json();
}

export async function getTopItems() {
  const res = await fetch(`${API_BASE}/analytics/top-items`);
  return res.json();
}

export async function getHazardBreakdown() {
  const res = await fetch(`${API_BASE}/analytics/hazard-breakdown`);
  return res.json();
}

export async function getRecentSubmissions(limit = 10) {
  const res = await fetch(`${API_BASE}/submissions/recent?limit=${limit}`);
  return res.json();
}

export async function getSubmissions({ search = "", tier = "All", page = 1, perPage = 10 }) {
  const params = new URLSearchParams({
    search,
    tier,
    page: page.toString(),
    per_page: perPage.toString()
  });
  const res = await fetch(`${API_BASE}/submissions?${params.toString()}`);
  return res.json();
}

export async function deleteSubmission(id) {
  const res = await fetch(`${API_BASE}/submissions/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    throw new Error("Failed to delete submission");
  }
  return res.json();
}

export function getExportLedgerUrl() {
  return `${API_BASE}/export-ledger`;
}
