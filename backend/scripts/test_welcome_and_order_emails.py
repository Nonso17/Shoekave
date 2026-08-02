import os
import sys
import django
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from products.models import Product, Order, OrderItem, Brand, Category
from accounts.emails import send_welcome_email, send_order_confirmation_email
from django.conf import settings

User = get_user_model()

print("--- BREVO EMAIL TEST SUITE ---")
print(f"Brevo API Key present: {bool(getattr(settings, 'BREVO_API_KEY', None))}")
print(f"Default From Email: {settings.DEFAULT_FROM_EMAIL}")
print(f"Target recipient: {settings.EMAIL_HOST_USER}")

test_email = settings.EMAIL_HOST_USER or "testuser@example.com"
user, created = User.objects.get_or_create(
    email=test_email,
    defaults={"first_name": "TestUser", "last_name": "Kave"}
)

print(f"\n1. Testing Welcome Email for {user.email}...")
try:
    res_welcome = send_welcome_email(user)
    print("[OK] Welcome Email Sent Successfully!", res_welcome)
except Exception as e:
    print("[FAIL] Welcome Email Failed:", type(e).__name__, str(e))

print(f"\n2. Testing Order Confirmation Email for {user.email}...")
try:
    brand, _ = Brand.objects.get_or_create(name="Test Brand")
    cat, _ = Category.objects.get_or_create(name="Sneakers")
    prod, _ = Product.objects.get_or_create(
        name="Nike Air Max 270",
        defaults={"brand": brand, "category": cat, "price": 45000.00, "description": "Classic sneakers"}
    )

    order = Order.objects.create(
        user=user,
        total_amount=90000.00,
        shipping_address="123 ShoeKave St, Victoria Island",
        phone_number="+2348012345678",
        city="Lagos",
        payment_method="Paystack Card",
        status="Processing"
    )

    OrderItem.objects.create(
        order=order,
        product=prod,
        size=42,
        quantity=2,
        price=45000.00
    )

    res_order = send_order_confirmation_email(order)
    print("[OK] Order Confirmation Email Sent Successfully!", res_order)

    order.delete()
except Exception as e:
    print("[FAIL] Order Confirmation Email Failed:", type(e).__name__, str(e))

print("\n--- TEST COMPLETE ---")
