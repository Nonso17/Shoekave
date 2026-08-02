import os
import django
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from rest_framework.test import APIRequestFactory
from accounts.views import PasswordResetRequestView, send_brevo_email
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

TEST_EMAIL = 'fallback-test@example.com'
user, created = User.objects.get_or_create(email=TEST_EMAIL)
if created:
    user.set_password('password123')
    user.save()
    print('Created user')

# Force SMTP to fail by overwriting settings
orig_host = settings.EMAIL_HOST
settings.EMAIL_HOST = 'invalid.invalid'

factory = APIRequestFactory()
request = factory.post('/api/password-reset/request/', {'email': TEST_EMAIL}, format='json')
view = PasswordResetRequestView.as_view()
response = view(request)
print('Response status:', response.status_code)
if hasattr(response, 'data'):
    print('Response data:', response.data)
else:
    try:
        print('Response content:', response.rendered_content)
    except Exception:
        print('Response has no data or rendered content')

# Restore settings
settings.EMAIL_HOST = orig_host

# Show user's reset code
user.refresh_from_db()
print('User reset_code:', user.reset_code)
