import os
import django
import sys
from pathlib import Path

# Ensure project root (backend/) is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.core.mail import send_mail
from django.conf import settings

try:
    print('EMAIL_HOST:', settings.EMAIL_HOST)
    print('EMAIL_PORT:', settings.EMAIL_PORT)
    print('EMAIL_USE_TLS:', settings.EMAIL_USE_TLS)
    print('EMAIL_HOST_USER:', settings.EMAIL_HOST_USER)
    res = send_mail('ShoeKave SMTP Test', 'This is a test sent via SMTP.', settings.DEFAULT_FROM_EMAIL, [settings.EMAIL_HOST_USER], fail_silently=False)
    print('send_mail returned:', res)
except Exception as e:
    print('ERROR', type(e).__name__, str(e))
