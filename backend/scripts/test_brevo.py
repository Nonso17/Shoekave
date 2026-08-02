import os
import django
import sys
from pathlib import Path

# Ensure project root (backend/) is on sys.path so Django settings can be imported
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.views import send_brevo_email
from django.conf import settings

try:
    print('Using BREVO_KEY:', getattr(settings, 'BREVO_API_KEY', None))
    result = send_brevo_email('ShoeKave Test', 'This is a Brevo API test from script.', settings.EMAIL_HOST_USER)
    print('OK', result)
except Exception as e:
    print('ERROR', type(e).__name__, str(e))
