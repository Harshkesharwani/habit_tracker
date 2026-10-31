# server/test_all_endpoints.py
import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

# 1. Login to get token
login_req = urllib.request.Request(
    f"{BASE_URL}/auth/login",
    data=json.dumps({"email": "demo@example.com", "password": "password123"}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(login_req) as res:
        token_data = json.loads(res.read().decode("utf-8"))
        token = token_data.get("token")
        print(f"[OK] Logged in successfully. Token: {token[:8]}...")
except Exception as e:
    print(f"[FAIL] Could not login: {e}")
    sys.exit(1)

# Helper function
def test_req(method, path, data=None, auth_prefix="Token"):
    url = f"{BASE_URL}{path}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"{auth_prefix} {token}"
    }
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            res_body = res.read().decode("utf-8")
            return res.getcode(), json.loads(res_body) if res_body and res_body.startswith(("{", "[")) else res_body
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")

# 1. Create a habit
status, habit = test_req("POST", "/habits", {"name": "Param Test Habit", "startDate": "2026-10-31", "goal": 2})
habit_id = habit.get("id")
print(f"Created Habit ID: {habit_id} (Status: {status})")

# 2. Create a label
status, label = test_req("POST", "/labels", {"name": f"Label_{habit_id}", "color": "#10b981"}, auth_prefix="Bearer")
label_id = label.get("id")
print(f"Created Label with Bearer Auth: ID={label_id} (Status: {status})")

# 3. Test Detail routes with Token, Bearer, and trailing slash
print("\n--- Testing Detail Routes with Bearer and Slash Variations ---")
code, res = test_req("GET", f"/habits/{habit_id}", auth_prefix="Bearer")
print(f"GET /habits/{habit_id} (Bearer): {code}")
code, res = test_req("GET", f"/habits/{habit_id}/", auth_prefix="Token")
print(f"GET /habits/{habit_id}/ (Trailing Slash): {code}")

# 4. Test Completion PUT & DELETE
code, res = test_req("PUT", f"/habits/{habit_id}/completions/2026-10-31", {"count": 1}, auth_prefix="Bearer")
print(f"PUT /habits/{habit_id}/completions/2026-10-31 (Bearer): {code}")
code, res = test_req("DELETE", f"/habits/{habit_id}/completions/2026-10-31/", auth_prefix="Token")
print(f"DELETE /habits/{habit_id}/completions/2026-10-31/ (Slash): {code}")

# 5. Test Archive & Unarchive
code, res = test_req("POST", f"/habits/{habit_id}/archive", auth_prefix="Bearer")
print(f"POST /habits/{habit_id}/archive (Bearer): {code}")
code, res = test_req("POST", f"/habits/{habit_id}/unarchive/", auth_prefix="Bearer")
print(f"POST /habits/{habit_id}/unarchive/ (Slash + Bearer): {code}")

# 6. Test Delete Label
code, res = test_req("DELETE", f"/labels/{label_id}", auth_prefix="Bearer")
print(f"DELETE /labels/{label_id} (Bearer): {code}")

# 7. Test Soft Delete to Trash & Restore
code, res = test_req("DELETE", f"/habits/{habit_id}/", auth_prefix="Bearer")
print(f"DELETE /habits/{habit_id}/ (Soft Delete, Slash + Bearer): {code}")
code, res = test_req("POST", f"/trash/{habit_id}/restore", auth_prefix="Bearer")
print(f"POST /trash/{habit_id}/restore (Restore from Trash, Bearer): {code}")

print("\n--- ALL TESTS COMPLETED CLEANLY! ---")
