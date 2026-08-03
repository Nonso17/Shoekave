from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from .models import Brand

class PublicBrandListViewTests(APITestCase):
    def test_get_brands(self):
        Brand.objects.create(name="Nike")
        Brand.objects.create(name="Adidas")
        
        url = reverse("public-brand-list")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("Nike", response.data)
        self.assertIn("Adidas", response.data)

