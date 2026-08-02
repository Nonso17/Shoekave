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
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APIClient

User = get_user_model()

test_email = "jwt_test_user@example.com"
user, _ = User.objects.get_or_create(email=test_email)

refresh = RefreshToken.for_user(user)
refresh_token_str = str(refresh)

client = APIClient()
response = client.post("/api/token/refresh/", {"refresh": refresh_token_str}, format="json")

print("Status Code:", response.status_code)
print("Refresh Output:", response.data)

assert response.status_code == 200
assert "access" in response.data
print("[OK] JWT Token refresh endpoint works cleanly!")

user.delete()
