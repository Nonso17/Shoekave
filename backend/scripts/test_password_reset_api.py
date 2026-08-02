import os
import django
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model

User = get_user_model()
client = Client()

TEST_EMAIL = 'test-reset@example.com'

# Create test user if not exists
user, created = User.objects.get_or_create(email=TEST_EMAIL)
if created:
    user.set_password('testpassword123')
    user.save()
    print('Created test user')
else:
    print('Test user exists')

resp = client.post('/api/password-reset/request/', {'email': TEST_EMAIL}, content_type='application/json')
print('Response status:', resp.status_code)
print('Response content:', resp.content)

user.refresh_from_db()
print('User reset_code:', user.reset_code)
