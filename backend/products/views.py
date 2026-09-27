import json
import logging
import requests
import hmac
import hashlib
import time

from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser,
)

from .models import (
    Product,
    ProductImage,
    ProductSize,
    Brand,
    Category,
    Order,
)
from .serializers import (
    ProductSerializer,
    OrderSerializer,
)
from .pagination import ProductPagination
from accounts.emails import send_order_confirmation_email

logger = logging.getLogger(__name__)


# ============================================================
# PUBLIC PRODUCT VIEWS
# ============================================================

class ProductListView(ListAPIView):
    permission_classes = []
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
    permission_classes = []

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


# ============================================================
# USER ORDER & CHECKOUT VIEWS
# ============================================================

class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrderSerializer(
            data=request.data,
            context={"request": request}
        )
        if serializer.is_valid():
            # Save order with default 'Pending' (unpaid) status
            order = serializer.save()

            # NOTE: Do NOT send order confirmation email here!
            # The order is created as pending/unpaid. Confirmation email and stock
            # deduction will ONLY happen once payment is successfully verified.

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
        orders = (
            Order.objects
            .filter(user=request.user)
            .select_related("user")
            .prefetch_related("items__product__images")
            .order_by("-created_at")
        )
        serializer = OrderSerializer(
            orders,
            many=True
        )
        return Response(serializer.data)


# ============================================================
# ORDER PAYMENT & STOCK HELPER
# ============================================================

def process_order_payment_success(order_id, user=None, payment_method="Kora"):
    """
    Atomic & idempotent order status update, stock deduction, and email dispatch
    upon verified successful payment.
    """
    try:
        with transaction.atomic():
            query = {"pk": order_id}
            if user and not user.is_staff:
                query["user"] = user

            # Lock the order row to guarantee idempotency across concurrent webhooks / client verifications
            order = Order.objects.select_for_update().get(**query)

            # Only process if status is still Pending (unpaid)
            if order.status == "Pending":
                order.status = "Processing"
                if payment_method:
                    order.payment_method = payment_method
                order.save()

                # Deduct stock for each item in the order
                for item in order.items.select_related("product").all():
                    try:
                        product_size = ProductSize.objects.select_for_update().get(
                            product=item.product,
                            size=item.size
                        )
                        if product_size.stock >= item.quantity:
                            product_size.stock -= item.quantity
                        else:
                            product_size.stock = 0
                        product_size.save()

                        # Recalculate total stock for the product
                        total_stock = sum(ps.stock for ps in item.product.sizes.all())
                        item.product.stock = total_stock
                        item.product.save()
                    except ProductSize.DoesNotExist:
                        pass

                # Dispatch Order Confirmation Email via Brevo now that payment is confirmed
                try:
                    send_order_confirmation_email(order)
                except Exception as exc:
                    logger.error(
                        f"Failed to send order confirmation email for order #{order.id}: {exc}"
                    )

                return order, True
            return order, False
    except Order.DoesNotExist:
        return None, False


# ============================================================
# KORA (KORAPAY) PAYMENT VIEWS
# ============================================================

class KoraInitializePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email = request.user.email
        amount = request.data.get("amount")
        order_id = request.data.get("order_id")

        if not amount:
            return Response(
                {"error": "Amount is required.", "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not order_id:
            return Response(
                {"error": "Order ID is required.", "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify that the order exists, belongs to the current user, and is unpaid/pending
        try:
            order = Order.objects.get(pk=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found.", "status": False},
                status=status.HTTP_404_NOT_FOUND
            )

        if order.status != "Pending":
            return Response(
                {"error": f"Order #{order_id} cannot be initialized (status is '{order.status}').", "status": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        secret_key = getattr(settings, "KORA_SECRET_KEY", "")
        if not secret_key:
            return Response(
                {"error": "Kora API Secret Key is not configured on server.", "status": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        url = "https://api.korapay.com/merchant/api/v1/charges/initialize"

        headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
        }

        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
        callback_url = request.data.get(
            "callback_url",
            f"{frontend_url}/payment/success"
        )

        ref_prefix = f"SK-{order_id}"
        reference = f"{ref_prefix}-{int(time.time())}"

        data = {
            "amount": float(amount),
            "currency": "NGN",
            "reference": reference,
            "customer": {
                "name": f"{request.user.first_name} {request.user.last_name}".strip() or request.user.email,
                "email": email,
            },
            "redirect_url": callback_url,
            "metadata": {
                "order_id": order_id,
                "user_id": request.user.id
            }
        }

        try:
            response = requests.post(
                url,
                json=data,
                headers=headers,
                timeout=15
            )
            try:
                result = response.json()
            except ValueError:
                result = {"error": "Invalid response from Kora payment gateway", "status": False}

            # Standardize output for compatibility with frontend authorization_url / checkout_url
            if isinstance(result, dict) and result.get("status") and "data" in result:
                if isinstance(result["data"], dict):
                    checkout_url = result["data"].get("checkout_url")
                    if checkout_url and "authorization_url" not in result["data"]:
                        result["data"]["authorization_url"] = checkout_url

            return Response(result, status=response.status_code)
        except Exception as e:
            logger.error(f"Kora payment initialization error: {e}")
            return Response(
                {"error": str(e), "status": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class KoraVerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, reference):
        secret_key = getattr(settings, "KORA_SECRET_KEY", "")
        if not secret_key:
            return Response(
                {"error": "Kora API Secret Key is not configured on server.", "status": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        url = f"https://api.korapay.com/merchant/api/v1/charges/{reference}"

        headers = {
            "Authorization": f"Bearer {secret_key}",
        }

        try:
            response = requests.get(
                url,
                headers=headers,
                timeout=15
            )
            try:
                result = response.json()
            except ValueError:
                result = {"error": "Invalid response from Kora payment gateway", "status": False}

            # Automatically process order status to "Processing" if payment verified successfully
            if isinstance(result, dict) and result.get("status") and result.get("data", {}).get("status") == "success":
                metadata = result.get("data", {}).get("metadata", {})
                order_id = metadata.get("order_id") if isinstance(metadata, dict) else None

                if not order_id and reference and reference.startswith("SK-"):
                    parts = reference.split("-")
                    if len(parts) >= 2 and parts[1].isdigit():
                        order_id = int(parts[1])

                if order_id:
                    process_order_payment_success(order_id, user=request.user, payment_method="Kora")
            elif isinstance(result, dict) and result.get("data", {}).get("status") in ["failed", "expired", "cancelled"]:
                metadata = result.get("data", {}).get("metadata", {})
                order_id = metadata.get("order_id") if isinstance(metadata, dict) else None
                if not order_id and reference and reference.startswith("SK-"):
                    parts = reference.split("-")
                    if len(parts) >= 2 and parts[1].isdigit():
                        order_id = int(parts[1])

                if order_id:
                    try:
                        order = Order.objects.get(pk=order_id)
                        if order.status == "Pending":
                            order.status = "Cancelled"
                            order.save()
                    except Order.DoesNotExist:
                        pass

            return Response(result, status=response.status_code)
        except Exception as e:
            logger.error(f"Kora payment verification error: {e}")
            return Response(
                {"error": str(e), "status": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class KoraWebhookView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        x_signature = (
            request.headers.get("x-korapay-signature")
            or request.headers.get("X-Korapay-Signature")
            or request.META.get("HTTP_X_KORAPAY_SIGNATURE")
        )

        secret_key = getattr(settings, "KORA_SECRET_KEY", "")
        if not secret_key:
            logger.error("KORA_SECRET_KEY is not configured for webhook signature verification.")
            return Response(
                {"error": "Server misconfiguration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not x_signature:
            logger.warning("Kora webhook received without x-korapay-signature header.")
            return Response(
                {"error": "Missing signature header"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Secure HMAC-SHA256 signature verification on raw request body
        raw_body = request.body
        computed_sig = hmac.new(
            secret_key.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(computed_sig, x_signature):
            logger.warning(f"Invalid Kora webhook signature. Received: {x_signature}")
            return Response(
                {"error": "Invalid signature"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except ValueError:
            return Response(
                {"error": "Invalid JSON body"},
                status=status.HTTP_400_BAD_REQUEST
            )

        event_type = payload.get("event")
        event_data = payload.get("data", {})

        reference = event_data.get("reference")
        txn_status = event_data.get("status")
        metadata = event_data.get("metadata", {})
        order_id = metadata.get("order_id") if isinstance(metadata, dict) else None

        if not order_id and reference and reference.startswith("SK-"):
            parts = reference.split("-")
            if len(parts) >= 2 and parts[1].isdigit():
                order_id = int(parts[1])

        # Double-Check Pattern: Verify charge status directly with Kora API server before granting order value
        if (event_type == "charge.success" or txn_status == "success") and reference:
            verify_url = f"https://api.korapay.com/merchant/api/v1/charges/{reference}"
            headers = {"Authorization": f"Bearer {secret_key}"}
            try:
                verify_res = requests.get(verify_url, headers=headers, timeout=10)
                if verify_res.status_code == 200:
                    v_data = verify_res.json()
                    v_status = v_data.get("data", {}).get("status") if v_data.get("status") else None
                    if v_status != "success":
                        logger.warning(f"Double-check verification failed for reference {reference}. Status: {v_status}")
                        return Response(
                            {"status": "ignored", "reason": "Verification failed"},
                            status=status.HTTP_200_OK
                        )
            except Exception as exc:
                logger.error(f"Kora double-check API error for reference {reference}: {exc}")

            if order_id:
                process_order_payment_success(order_id, payment_method="Kora")

        elif txn_status in ["failed", "expired", "cancelled"]:
            if order_id:
                try:
                    order = Order.objects.get(pk=order_id)
                    if order.status == "Pending":
                        order.status = "Cancelled"
                        order.save()
                except Order.DoesNotExist:
                    pass

        return Response({"status": "success"}, status=status.HTTP_200_OK)


# Set active payment gateway views to Kora
InitializePaymentView = KoraInitializePaymentView
VerifyPaymentView = KoraVerifyPaymentView


# ============================================================
# LEGACY PAYSTACK PAYMENT VIEWS (KEPT FOR RETENTION)
# ============================================================

class PaystackInitializePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email = request.user.email
        amount = request.data.get("amount")
        order_id = request.data.get("order_id")
        if not amount:
            return Response(
                {"error": "Amount is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        url = "https://api.paystack.co/transaction/initialize"
        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        frontend_url = getattr(settings, "FRONTEND_URL", "https://shoekave.com").rstrip("/")
        callback_url = request.data.get(
            "callback_url",
            f"{frontend_url}/payment/success"
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
            try:
                result = response.json()
            except ValueError:
                result = {"error": "Invalid response from payment gateway"}
            return Response(result, status=response.status_code)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaystackVerifyPaymentView(APIView):
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
            try:
                result = response.json()
            except ValueError:
                result = {"error": "Invalid response from payment gateway"}

            if result.get("status") and result.get("data", {}).get("status") == "success":
                metadata = result.get("data", {}).get("metadata", {})
                order_id = metadata.get("order_id") if isinstance(metadata, dict) else None
                if order_id:
                    process_order_payment_success(order_id, user=request.user, payment_method="Paystack")

            return Response(result, status=response.status_code)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================
# ADMIN PRODUCT VIEWS
# ============================================================

class AdminProductListView(APIView):
    permission_classes = [IsAdminUser]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get(self, request):
        products = (
            Product.objects
            .select_related(
                "brand",
                "category"
            )
            .prefetch_related(
                "sizes",
                "images"
            )
            .order_by("-id")
        )

        serializer = ProductSerializer(
            products,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):
        data = (
            request.data.dict()
            if hasattr(request.data, "dict")
            else request.data.copy()
        )

        # Parse nested sizes JSON string if sent via FormData
        if isinstance(data.get("sizes"), str):
            try:
                data["sizes"] = json.loads(
                    data["sizes"]
                )
            except json.JSONDecodeError:
                data["sizes"] = []

        serializer = ProductSerializer(
            data=data
        )

        if serializer.is_valid():
            product = serializer.save()

            # Handle image uploads
            images = (
                request.FILES.getlist("images")
                or request.FILES.getlist("image")
            )

            if not images and "image" in request.FILES:
                images = [
                    request.FILES["image"]
                ]

            for img in images:
                ProductImage.objects.create(
                    product=product,
                    image=img
                )

            # Reload product with related objects
            fresh_product = (
                Product.objects
                .select_related(
                    "brand",
                    "category"
                )
                .prefetch_related(
                    "sizes",
                    "images"
                )
                .get(pk=product.pk)
            )

            return Response(
                ProductSerializer(
                    fresh_product
                ).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminProductDetailView(APIView):
    permission_classes = [IsAdminUser]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_object(self, pk):
        try:
            return (
                Product.objects
                .select_related(
                    "brand",
                    "category"
                )
                .prefetch_related(
                    "sizes",
                    "images"
                )
                .get(pk=pk)
            )
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self.get_object(pk)

        if not product:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            ProductSerializer(product).data
        )

    def patch(self, request, pk):
        product = self.get_object(pk)

        if not product:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        data = (
            request.data.dict()
            if hasattr(request.data, "dict")
            else request.data.copy()
        )

        if isinstance(data.get("sizes"), str):
            try:
                data["sizes"] = json.loads(
                    data["sizes"]
                )
            except json.JSONDecodeError:
                pass

        serializer = ProductSerializer(
            product,
            data=data,
            partial=True
        )

        if serializer.is_valid():
            product = serializer.save()

            # Handle new image uploads
            images = (
                request.FILES.getlist("images")
                or request.FILES.getlist("image")
            )

            if not images and "image" in request.FILES:
                images = [
                    request.FILES["image"]
                ]

            for img in images:
                ProductImage.objects.create(
                    product=product,
                    image=img
                )

            # Reload with related objects
            fresh_product = (
                Product.objects
                .select_related(
                    "brand",
                    "category"
                )
                .prefetch_related(
                    "sizes",
                    "images"
                )
                .get(pk=product.pk)
            )

            return Response(
                ProductSerializer(
                    fresh_product
                ).data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        product = self.get_object(pk)

        if not product:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        product.delete()

        return Response(
            {
                "message":
                "Product deleted successfully."
            },
            status=status.HTTP_200_OK
        )


class BrandCategoryListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        brands = list(
            Brand.objects.values_list(
                "name",
                flat=True
            )
        )

        categories = list(
            Category.objects.values_list(
                "name",
                flat=True
            )
        )

        return Response({
            "brands": brands,
            "categories": categories
        })


class PublicBrandListView(APIView):
    permission_classes = []

    def get(self, request):
        brands = list(
            Brand.objects.values_list(
                "name",
                flat=True
            )
        )

        return Response(brands)


# ============================================================
# ADMIN ORDER VIEWS
# ============================================================

class AdminOrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = (
            Order.objects
            .select_related("user")
            .prefetch_related(
                "items__product__images"
            )
            .order_by("-created_at")
        )

        serializer = OrderSerializer(
            orders,
            many=True
        )

        return Response(serializer.data)


class AdminOrderDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            order = (
                Order.objects
                .select_related("user")
                .prefetch_related(
                    "items__product__images"
                )
                .get(pk=pk)
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get(
            "status"
        )

        if (
            new_status
            and new_status in dict(
                Order.STATUS_CHOICES
            )
        ):
            order.status = new_status
            order.save()

            return Response(
                OrderSerializer(order).data
            )

        return Response(
            {
                "error":
                "Invalid order status."
            },
            status=status.HTTP_400_BAD_REQUEST
        )