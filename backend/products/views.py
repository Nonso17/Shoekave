import json
import logging
import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Prefetch

from .models import Product, ProductImage, ProductSize, Brand, Category, Order
from .serializers import ProductSerializer, ProductImageSerializer, OrderSerializer
from accounts.emails import send_order_confirmation_email
from rest_framework.generics import ListAPIView
from .pagination import ProductPagination
logger = logging.getLogger(__name__)



from rest_framework.generics import ListAPIView

class ProductListView(ListAPIView):
    serializer_class = ProductSerializer
    pagination_class = ProductPagination

    def get_queryset(self):
        queryset = (
            Product.objects
            .select_related("brand", "category")
            .prefetch_related("images", "sizes")
            .order_by("-id")
        )

        brand = self.request.query_params.get("brand")

        if brand and brand.lower() != "all":
            queryset = queryset.filter(brand__name__iexact=brand)

        return queryset


class ProductDetailView(APIView):
    def get(self, request, pk):
        try:
            product = (
                Product.objects
                .select_related("brand", "category")
                .prefetch_related("images", "sizes")
                .get(pk=pk)
            )
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProductSerializer(product)
        return Response(serializer.data)

class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrderSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            order = serializer.save()

            # Send Order Confirmation Email via Brevo
            try:
                send_order_confirmation_email(order)
            except Exception as exc:
                logger.error(f"Failed to send order confirmation email for order #{order.id}: {exc}")

            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class MyOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(
            user=request.user
        ).order_by("-created_at")
        serializer = OrderSerializer(
            orders,
            many=True
        )
        return Response(serializer.data)


class AdminProductListView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        products = Product.objects.all().order_by("-id")
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.dict() if hasattr(request.data, 'dict') else request.data.copy()
        
        # Parse nested sizes JSON string if sent via FormData
        if isinstance(data.get('sizes'), str):
            try:
                data['sizes'] = json.loads(data['sizes'])
            except json.JSONDecodeError:
                data['sizes'] = []

        serializer = ProductSerializer(data=data)
        if serializer.is_valid():
            product = serializer.save()

            # Handle image uploads
            images = request.FILES.getlist('images') or request.FILES.getlist('image')
            if not images and 'image' in request.FILES:
                images = [request.FILES['image']]
            
            for img in images:
                ProductImage.objects.create(product=product, image=img)

            fresh_product = Product.objects.get(pk=product.pk)
            return Response(ProductSerializer(fresh_product).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminProductDetailView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"error": "Product not found."}, status=404)
        return Response(ProductSerializer(product).data)

    def patch(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"error": "Product not found."}, status=404)

        data = request.data.dict() if hasattr(request.data, 'dict') else request.data.copy()
        
        if isinstance(data.get('sizes'), str):
            try:
                data['sizes'] = json.loads(data['sizes'])
            except json.JSONDecodeError:
                pass

        serializer = ProductSerializer(product, data=data, partial=True)
        if serializer.is_valid():
            product = serializer.save()

            # Handle new image uploads
            images = request.FILES.getlist('images') or request.FILES.getlist('image')
            if not images and 'image' in request.FILES:
                images = [request.FILES['image']]

            for img in images:
                ProductImage.objects.create(product=product, image=img)

            fresh_product = Product.objects.get(pk=product.pk)
            return Response(ProductSerializer(fresh_product).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"error": "Product not found."}, status=404)
        product.delete()
        return Response({"message": "Product deleted successfully."}, status=200)


class BrandCategoryListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        brands = list(Brand.objects.values_list("name", flat=True))
        categories = list(Category.objects.values_list("name", flat=True))
        return Response({
            "brands": brands,
            "categories": categories
        })


class PublicBrandListView(APIView):
    permission_classes = []

    def get(self, request):
        brands = list(Brand.objects.values_list("name", flat=True))
        return Response(brands)


class AdminOrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = Order.objects.all().order_by("-created_at")
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class AdminOrderDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=404)

        new_status = request.data.get("status")
        if new_status and new_status in dict(Order.STATUS_CHOICES):
            order.status = new_status
            order.save()
            return Response(OrderSerializer(order).data)
        
        return Response({"error": "Invalid order status."}, status=400)

class InitializePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email = request.user.email
        amount = request.data.get("amount")
        order_id = request.data.get("order_id")
        if not amount:
            return Response({"error": "Amount is required."}, status=400)

        url = "https://api.paystack.co/transaction/initialize"

        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        callback_url = request.data.get(
            "callback_url",
            "http://localhost:5173/payment/success"
        )

        data = {
            "email": email,
            "amount": int(float(amount) * 100),
            "callback_url": callback_url,
            "metadata": {
                "order_id": order_id,
                "user_id": request.user.id
            } if order_id else {}
        }

        try:
            response = requests.post(
                url,
                json=data,
                headers=headers
            )
            result = response.json()
            return Response(result, status=response.status_code)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, reference):
        url = f"https://api.paystack.co/transaction/verify/{reference}"

        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        }

        try:
            response = requests.get(
                url,
                headers=headers
            )
            result = response.json()

            # Automatically update order status to "Processing" if payment verified successfully
            if result.get("status") and result.get("data", {}).get("status") == "success":
                metadata = result.get("data", {}).get("metadata", {})
                order_id = metadata.get("order_id") if isinstance(metadata, dict) else None
                if order_id:
                    try:
                        order = Order.objects.get(pk=order_id, user=request.user)
                        if order.status == "Pending":
                            order.status = "Processing"
                            order.save()
                    except Order.DoesNotExist:
                        pass

            return Response(result, status=response.status_code)
        except Exception as e:
            return Response({"error": str(e)}, status=500)