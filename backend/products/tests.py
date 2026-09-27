from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Product, ProductSize, Brand, Category, Order, OrderItem

User = get_user_model()


class PublicBrandListViewTests(APITestCase):
    def test_get_brands(self):
        Brand.objects.create(name="Nike")
        Brand.objects.create(name="Adidas")
        
        url = reverse("public-brand-list")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Nike", response.data)
        self.assertIn("Adidas", response.data)


class ProductEndpointsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="user@example.com",
            password="userpassword123"
        )
        self.admin = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpassword123"
        )

        self.brand = Brand.objects.create(name="Puma")
        self.category = Category.objects.create(name="Sneakers")
        self.product = Product.objects.create(
            name="Puma Suede",
            description="Classic sneaker",
            brand=self.brand,
            category=self.category,
            price="120.00",
            stock=10
        )
        ProductSize.objects.create(product=self.product, size=42, stock=10)

    def test_1_get_product_list(self):
        url = "/api/products/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "Puma Suede")
        self.assertTrue(response.data["results"][0]["available"])

    def test_2_get_product_detail(self):
        url = f"/api/products/{self.product.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Puma Suede")
        self.assertEqual(response.data["brand"], "Puma")
        self.assertEqual(response.data["category"], "Sneakers")

    def test_3_get_admin_products(self):
        url = "/api/products/admin/products/"
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_4_post_admin_product(self):
        url = "/api/products/admin/products/"
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Nike Air Max",
            "description": "Running shoes",
            "brand": "Nike",
            "category": "Running",
            "price": "150.00",
            "sizes": '[{"size": 42, "stock": 5}]'
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Nike Air Max")
        self.assertEqual(response.data["brand"], "Nike")

    def test_5_patch_admin_product(self):
        url = f"/api/products/admin/products/{self.product.id}/"
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Puma Suede Updated",
            "price": "130.00"
        }
        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Puma Suede Updated")

    def test_6_delete_admin_product(self):
        temp_product = Product.objects.create(
            name="Temp Product",
            description="Temp",
            brand=self.brand,
            category=self.category,
            price="50.00"
        )
        url = f"/api/products/admin/products/{temp_product.id}/"
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Product.objects.filter(id=temp_product.id).exists())

    def test_7_get_admin_orders(self):
        url = "/api/products/admin/orders/"
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("products.views.send_order_confirmation_email")
    def test_8_post_checkout(self, mock_send_email):
        url = "/api/products/checkout/"
        self.client.force_authenticate(user=self.user)
        payload = {
            "total_amount": "120.00",
            "shipping_address": "123 Main St",
            "phone_number": "1234567890",
            "city": "Lagos",
            "items": [
                {
                    "product": self.product.id,
                    "size": 42,
                    "quantity": 1,
                    "price": "120.00"
                }
            ]
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(OrderItem.objects.count(), 1)
        created_order = Order.objects.get(id=response.data["id"])
        self.assertEqual(created_order.status, "Pending")
        # Ensure email is NOT sent at initial checkout creation
        mock_send_email.assert_not_called()

    def test_9_get_my_orders(self):
        Order.objects.create(
            user=self.user,
            total_amount="120.00",
            shipping_address="123 Main St",
            phone_number="1234567890",
            city="Lagos"
        )
        url = "/api/products/orders/"
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    @patch("products.views.requests.post")
    def test_10_post_initialize_payment(self, mock_post):
        order = Order.objects.create(
            user=self.user,
            total_amount="120.00",
            shipping_address="123 Main St",
            phone_number="1234567890",
            city="Lagos",
            status="Pending"
        )
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "status": True,
            "message": "Authorization URL created",
            "data": {
                "checkout_url": "https://checkout.korapay.com/access_code",
                "authorization_url": "https://checkout.korapay.com/access_code",
                "reference": f"SK-{order.id}-123456"
            }
        }
        url = "/api/products/payment/initialize/"
        self.client.force_authenticate(user=self.user)
        payload = {
            "amount": 120.00,
            "order_id": order.id
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])

    @patch("products.views.send_order_confirmation_email")
    def test_11_process_order_payment_success_idempotency(self, mock_send_email):
        from products.views import process_order_payment_success
        order = Order.objects.create(
            user=self.user,
            total_amount="120.00",
            shipping_address="123 Main St",
            phone_number="1234567890",
            city="Lagos",
            status="Pending"
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            size=42,
            quantity=2,
            price="120.00"
        )

        initial_size_stock = ProductSize.objects.get(product=self.product, size=42).stock
        self.assertEqual(initial_size_stock, 10)

        # First verification call: Should mark Processing, deduct stock, send email
        order_obj, processed = process_order_payment_success(order.id, user=self.user, payment_method="Kora")
        self.assertTrue(processed)
        self.assertEqual(order_obj.status, "Processing")
        self.assertEqual(ProductSize.objects.get(product=self.product, size=42).stock, 8)
        self.assertEqual(mock_send_email.call_count, 1)

        # Second duplicate verification call (webhook retry / duplicate tab): Should return False, not deduct stock again or send 2nd email
        order_obj_repeat, processed_repeat = process_order_payment_success(order.id, user=self.user, payment_method="Kora")
        self.assertFalse(processed_repeat)
        self.assertEqual(order_obj_repeat.status, "Processing")
        self.assertEqual(ProductSize.objects.get(product=self.product, size=42).stock, 8)
        self.assertEqual(mock_send_email.call_count, 1)

