import os
import sys
import django
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.conf import settings
settings.ALLOWED_HOSTS = ['*']

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

test_email = "reset_test_user@example.com"
user, created = User.objects.get_or_create(
    email=test_email,
    defaults={"first_name": "ResetUser", "reset_code": "123456"}
)
user.reset_code = "123456"
user.save()

client = APIClient()
response = client.post("/api/password-reset/confirm/", {
    "email": test_email,
    "code": "123456",
    "new_password": "NewSecretPassword123!"
}, format="json")

print("Status Code:", response.status_code)
print("Response Data:", response.data)

assert response.status_code == 200
assert "tokens" in response.data
assert "access" in response.data["tokens"]
assert "refresh" in response.data["tokens"]
print("[OK] Password reset successfully generates JWT tokens for automatic login!")

user.delete()
