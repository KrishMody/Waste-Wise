import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000/api"

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def post_form(path, data):
    encoded = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=encoded,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def delete_req(path):
    req = urllib.request.Request(f"{BASE_URL}{path}", method="DELETE")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_tests():
    print("=== TEST 1: Health & Network Status ===")
    health = get("/health")
    assert health["status"] == "operational"
    print("[OK] Health operational:", health)

    network = get("/network-status")
    assert network["gateway_status"] == "ONLINE"
    assert len(network["active_hubs"]) > 0
    print("[OK] Network status active with hubs:", len(network["active_hubs"]))

    print("\n=== TEST 2: Initial Dynamic KPIs & Breakdown ===")
    initial_kpis = get("/kpis")
    print("Initial KPIs:", initial_kpis)
    initial_total = initial_kpis["total_scans"]
    initial_high = initial_kpis["high_risk_count"]

    print("\n=== TEST 3: User Scan Ingestion & Statutory Hazard Mapping ===")
    # Scan a Lithium-ion battery
    scan_res = post_form("/scan", {
        "item_hint": "Swollen Lithium-Ion Phone Battery",
        "user_lat": 12.9716,
        "user_lng": 77.5946
    })
    print("Scan Result Item:", scan_res["item_name"])
    print("Hazard Tier:", scan_res["hazard_tier"], "(Class:", scan_res["hazard_class"], ")")
    print("Confidence:", scan_res["confidence_score"])
    print("Disposal Instructions:", scan_res["disposal_instructions"][:60], "...")
    print("Closest Facility:", scan_res["closest_facility"]["name"], f"({scan_res['closest_facility']['distance_km']} km)")
    
    assert scan_res["hazard_tier"] == "Immediate Hazard"
    assert scan_res["closest_facility"]["distance_km"] >= 0
    assert len(scan_res["ranked_facilities"]) > 1
    # Verify ranking is ascending by distance
    distances = [f["distance_km"] for f in scan_res["ranked_facilities"]]
    assert distances == sorted(distances), "Facilities must be sorted closest to farthest"
    print("[OK] Facilities correctly ranked closest to farthest:", distances)

    new_sub_id = scan_res["submission_id"]

    print("\n=== TEST 4: Verify Dynamic KPI & Analytics Recalculation ===")
    updated_kpis = get("/kpis")
    print("Updated KPIs:", updated_kpis)
    assert updated_kpis["total_scans"] == initial_total + 1
    assert updated_kpis["high_risk_count"] == initial_high + 1
    print("[OK] Metrics recalculated dynamically with zero hardcoded values!")

    rhythm = get("/analytics/volume-rhythm")
    assert len(rhythm["rhythm"]) == 24
    print("[OK] 24-hour volume rhythm buckets verified")

    top_items = get("/analytics/top-items")
    assert len(top_items["items"]) <= 5
    print("[OK] Top items chart dynamic data verified:", top_items["items"][:2])

    hazard_dist = get("/analytics/hazard-breakdown")
    print("[OK] Hazard distribution:", hazard_dist["distribution"])

    print("\n=== TEST 5: Submissions Log Filtering, Search & Detail ===")
    logs = get(f"/submissions?tier=Immediate%20Hazard&page=1&per_page=10")
    assert any(s["id"] == new_sub_id for s in logs["items"])
    print("[OK] Submissions log pagination & tier filter verified, found new submission:", new_sub_id)

    print("\n=== TEST 6: Submissions Deletion & Metric Dynamic Reduction ===")
    del_res = delete_req(f"/submissions/{new_sub_id}")
    assert del_res["success"] is True
    print("[OK] Submission deleted successfully:", del_res)

    post_del_kpis = get("/kpis")
    assert post_del_kpis["total_scans"] == initial_total
    assert post_del_kpis["high_risk_count"] == initial_high
    print("[OK] KPIs and charts dynamically recalculated back to original state upon deletion!")

    print("\n=== ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
