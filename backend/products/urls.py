from django.urls import path
from .views import (
    ProductListView,
    ProductDetailView,
    CheckoutView,
    MyOrdersView,
    AdminProductListView,
    AdminProductDetailView,
    BrandCategoryListView,
    AdminOrderListView,
    AdminOrderDetailView,
    InitializePaymentView,
    VerifyPaymentView,
)

urlpatterns = [
    path("", ProductListView.as_view(), name="product-list"),
    path("<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
    path("checkout/", CheckoutView.as_view()),
    path("orders/", MyOrdersView.as_view()),
    path("admin/products/", AdminProductListView.as_view()),
    path("admin/products/<int:pk>/", AdminProductDetailView.as_view()),
    path("admin/meta/", BrandCategoryListView.as_view()),
    path("admin/orders/", AdminOrderListView.as_view()),
    path("admin/orders/<int:pk>/", AdminOrderDetailView.as_view()),
    path("payment/initialize/", InitializePaymentView.as_view(), name="payment-initialize"),
    path("payment/verify/<str:reference>/", VerifyPaymentView.as_view(), name="payment-verify"),
]
