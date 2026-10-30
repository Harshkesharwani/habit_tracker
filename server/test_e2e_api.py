# server/test_e2e_api.py
import urllib.request
import urllib.error
import json
import sys
from datetime import date, timedelta

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Token {token}"

    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            status_code = response.getcode()
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body) if res_body else None
            return status_code, res_json, response.headers
    except urllib.error.HTTPError as e:
        status_code = e.code
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
        except Exception:
            err_json = {"raw": err_body}
        return status_code, err_json, e.headers

def run_tests():
    print("=" * 60)
    print("STARTING LIVE END-TO-END QA & API TEST SUITE")
    print("Target:", BASE_URL)
    print("=" * 60)

    passed = 0
    failed = 0

    def assert_test(condition, test_name, details=""):
        nonlocal passed, failed
        if condition:
            print(f"[PASS] {test_name}")
            passed += 1
        else:
            print(f"[FAIL] {test_name} - {details}")
            failed += 1

    # 1. Test Demo User Login
    status, res, headers = make_request("/auth/login", method="POST", data={
        "email": "tanay@example.com",
        "password": "password123"
    })
    assert_test(status == 200 and "token" in res, "1. Demo user login (/auth/login)")
    tanay_token = res["token"] if res and "token" in res else None

    # Check CORS header
    cors_origin = headers.get("Access-Control-Allow-Origin")
    print(f"       CORS Header: Access-Control-Allow-Origin = {cors_origin}")

    # 2. Test Invalid Password Login
    status, res, _ = make_request("/auth/login", method="POST", data={
        "email": "tanay@example.com",
        "password": "wrongpassword"
    })
    assert_test(status == 400 and res.get("error", {}).get("code") == "VALIDATION_ERROR", "2. Invalid password rejected with VALIDATION_ERROR")

    # 3. Test Signup with New User
    unique_email = f"qa_test_{date.today().strftime('%Y%m%d')}_{id(object())}@example.com"
    status, res, _ = make_request("/auth/signup", method="POST", data={
        "firstName": "QA",
        "lastName": "Tester",
        "email": unique_email,
        "password": "strongPassword123"
    })
    assert_test(status == 201 and "token" in res, f"3. User registration ({unique_email})")
    new_user_token = res["token"] if res and "token" in res else None

    # 4. Duplicate Signup Protection
    status, res, _ = make_request("/auth/signup", method="POST", data={
        "firstName": "QA",
        "lastName": "Tester",
        "email": unique_email,
        "password": "strongPassword123"
    })
    assert_test(status == 400 and res.get("error", {}).get("code") == "VALIDATION_ERROR", "4. Duplicate email registration prevented")

    # 5. Short Password Rejection (< 6 chars)
    status, res, _ = make_request("/auth/signup", method="POST", data={
        "firstName": "Short",
        "lastName": "Pass",
        "email": "short@example.com",
        "password": "123"
    })
    assert_test(status == 400 and res.get("error", {}).get("code") == "VALIDATION_ERROR", "5. Password min-length validation (< 6 chars)")

    # 6. Protected Route Without Auth (/api/habits)
    status, res, _ = make_request("/habits", method="GET")
    assert_test(status == 401 and res.get("error", {}).get("code") == "UNAUTHORIZED", "6. Protected endpoint unauthenticated access rejected (401)")

    # 7. Protected Route With Token (/api/auth/me)
    status, res, _ = make_request("/auth/me", method="GET", token=new_user_token)
    assert_test(status == 200 and res.get("email") == unique_email, "7. Authenticated user profile retrieval (/auth/me)")

    # 8. Create Habit
    today_str = date.today().strftime("%Y-%m-%d")
    status, habit_res, _ = make_request("/habits", method="POST", token=new_user_token, data={
        "name": "QA Habit - Exercise",
        "description": "Daily 30 min cardio",
        "startDate": today_str,
        "goal": 2,
        "frequency": "DAILY",
        "color": "green",
        "labelNames": ["Health", "Fitness"]
    })
    assert_test(status == 201 and habit_res.get("name") == "QA Habit - Exercise", "8. Habit creation (/habits POST)")
    habit_id = habit_res.get("id") if habit_res else None

    # 9. List Habits
    status, habits_list, _ = make_request("/habits", method="GET", token=new_user_token)
    assert_test(status == 200 and len(habits_list) == 1 and habits_list[0]["id"] == habit_id, "9. List active habits (/habits GET)")

    # 10. Data Ownership Isolation (User Tanay cannot access QA Tester's habit)
    status, res, _ = make_request(f"/habits/{habit_id}", method="GET", token=tanay_token)
    assert_test(status == 404, f"10. Ownership isolation: User B cannot access User A's habit (404)")

    # 11. Habit Edit/Update
    status, update_res, _ = make_request(f"/habits/{habit_id}", method="PATCH", token=new_user_token, data={
        "name": "QA Habit - Exercise & Yoga",
        "goal": 3
    })
    assert_test(status == 200 and update_res.get("name") == "QA Habit - Exercise & Yoga" and update_res.get("goal") == 3, "11. Habit update (/habits/:id PATCH)")

    # 12. Completion Recording & Duplicate Prevention (PUT)
    status, comp1, _ = make_request(f"/habits/{habit_id}/completions/{today_str}", method="PUT", token=new_user_token, data={
        "count": 1
    })
    assert_test(status == 200 and comp1.get("count") == 1, "12. Record completion (/habits/:id/completions/:date PUT)")

    # Update completion for same date (must NOT create a duplicate record in DB)
    status, comp2, _ = make_request(f"/habits/{habit_id}/completions/{today_str}", method="PUT", token=new_user_token, data={
        "count": 3
    })
    status, all_comps, _ = make_request(f"/habits/{habit_id}/completions", method="GET", token=new_user_token)
    assert_test(status == 200 and len(all_comps) == 1 and all_comps[0]["count"] == 3, "13. Duplicate completion prevented at data layer (unique count=1)")

    # 14. Dashboard Statistics Calculation
    status, stats, _ = make_request(f"/dashboard/stats?date={today_str}", method="GET", token=new_user_token)
    assert_test(
        status == 200 and
        stats.get("total") == 1 and
        stats.get("completedToday") == 1 and
        stats.get("habitScore") == 100,
        "14. Dynamic dashboard statistics computed from actual completions (100% score)"
    )

    # 15. Undo Completion (DELETE)
    status, del_comp, _ = make_request(f"/habits/{habit_id}/completions/{today_str}", method="DELETE", token=new_user_token)
    status, all_comps_after, _ = make_request(f"/habits/{habit_id}/completions", method="GET", token=new_user_token)
    assert_test(status == 200 and len(all_comps_after) == 0, "15. Undo completion (/habits/:id/completions/:date DELETE)")

    # 16. Archive Habit
    status, arch_res, _ = make_request(f"/habits/{habit_id}/archive", method="POST", token=new_user_token)
    status, active_habits, _ = make_request("/habits?status=active", method="GET", token=new_user_token)
    status, archived_habits, _ = make_request("/habits?status=archived", method="GET", token=new_user_token)
    assert_test(
        status == 200 and
        len(active_habits) == 0 and
        len(archived_habits) == 1,
        "16. Archiving excludes habit from active list and moves to archived"
    )

    # 17. Unarchive Habit
    status, unarch_res, _ = make_request(f"/habits/{habit_id}/unarchive", method="POST", token=new_user_token)
    status, active_habits_after, _ = make_request("/habits?status=active", method="GET", token=new_user_token)
    assert_test(status == 200 and len(active_habits_after) == 1, "17. Unarchive restores habit to active list")

    # 18. Soft Delete to Trash
    status, trash_res, _ = make_request(f"/habits/{habit_id}", method="DELETE", token=new_user_token)
    status, trash_list, _ = make_request("/trash", method="GET", token=new_user_token)
    assert_test(status == 200 and len(trash_list) == 1, "18. Soft-delete habit to trash (/habits/:id DELETE)")

    # 19. Restore from Trash
    status, restore_res, _ = make_request(f"/trash/{habit_id}/restore", method="POST", token=new_user_token)
    status, trash_list_after, _ = make_request("/trash", method="GET", token=new_user_token)
    assert_test(status == 200 and len(trash_list_after) == 0, "19. Restore habit from trash (/trash/:id/restore POST)")

    # 20. Labels CRUD
    status, label_res, _ = make_request("/labels", method="POST", token=new_user_token, data={
        "name": "Meditation",
        "color": "#10b981"
    })
    label_id = label_res.get("id") if label_res else None
    status, labels_list, _ = make_request("/labels", method="GET", token=new_user_token)
    assert_test(status == 200 and any(l["name"] == "Meditation" for l in labels_list), "20. Create and list labels (/labels)")

    if label_id:
        status, del_label, _ = make_request(f"/labels/{label_id}", method="DELETE", token=new_user_token)
        assert_test(status == 200, "21. Delete label (/labels/:id DELETE)")

    # 22. Permanent Delete from Trash
    make_request(f"/habits/{habit_id}", method="DELETE", token=new_user_token)
    status, perm_del, _ = make_request(f"/trash/{habit_id}", method="DELETE", token=new_user_token)
    status, trash_empty_check, _ = make_request("/trash", method="GET", token=new_user_token)
    assert_test(status == 200 and len(trash_empty_check) == 0, "22. Permanent deletion from trash")

    # 23. Export CSV Endpoint
    req_csv = urllib.request.Request(f"{BASE_URL}/habits/export/csv", headers={"Authorization": f"Token {new_user_token}"})
    try:
        with urllib.request.urlopen(req_csv) as res_csv:
            csv_content = res_csv.read().decode('utf-8')
            assert_test(res_csv.getcode() == 200 and "Habit ID" in csv_content, "23. Export habits & completions to CSV (/habits/export/csv)")
    except Exception as e:
        assert_test(False, "23. Export habits & completions to CSV", str(e))

    # 24. Custom Challenges CRUD
    status, chal_res, _ = make_request("/challenges", method="POST", token=new_user_token, data={
        "title": "21-Day Habit Formation",
        "description": "Daily consistency sprint",
        "category": "Learning",
        "durationDays": 21,
        "startDate": str(date.today())
    })
    chal_id = chal_res.get("id") if chal_res else None
    status, chal_list, _ = make_request("/challenges", method="GET", token=new_user_token)
    assert_test(status == 200 and len(chal_list) >= 1 and chal_list[0]["title"] == "21-Day Habit Formation", "24. Create and list custom challenges (/challenges)")

    if chal_id:
        status, patch_chal, _ = make_request(f"/challenges/{chal_id}", method="PATCH", token=new_user_token, data={"isCompleted": True})
        assert_test(status == 200 and patch_chal.get("isCompleted") is True, "25. Toggle challenge sprint completion (/challenges/:id PATCH)")

    # 26. Pomodoro Focus Sessions
    status, pomo_res, _ = make_request("/pomodoro", method="POST", token=new_user_token, data={
        "durationMinutes": 25
    })
    status, pomo_list, _ = make_request("/pomodoro", method="GET", token=new_user_token)
    assert_test(status == 200 and pomo_list.get("todayCount", 0) >= 1, "26. Log and retrieve Pomodoro focus sessions (/pomodoro)")

    # 27. Logout & Token Invalidation
    status, logout_res, _ = make_request("/auth/logout", method="POST", token=new_user_token)
    status, me_after_logout, _ = make_request("/auth/me", method="GET", token=new_user_token)
    assert_test(status == 401, "27. Logout invalidates token on server (/auth/logout)")

    print("=" * 60)
    print(f"RESULTS: {passed} PASSED, {failed} FAILED (Total: {passed + failed})")
    print("=" * 60)
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
