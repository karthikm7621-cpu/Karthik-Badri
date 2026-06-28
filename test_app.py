import pytest
from app import app, db


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client


def test_get_employees_empty(client):
    response = client.get("/api/employees")
    assert response.status_code == 200
    assert response.json == []


def test_submit_leave_no_text(client):
    response = client.post("/api/submit-leave", json={})
    assert response.status_code == 400
    assert "error" in response.json
