from fastapi.testclient import TestClient
from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Should contain some known activities from the in-memory store
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    test_email = "tester@example.com"

    # Ensure the test email is not present initially
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    # Signup
    signup_resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert signup_resp.status_code == 200
    assert test_email in activities[activity]["participants"]

    # Verify GET shows the new participant
    get_resp = client.get("/activities")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert test_email in data[activity]["participants"]

    # Unregister
    delete_resp = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert delete_resp.status_code == 200
    assert test_email not in activities[activity]["participants"]
