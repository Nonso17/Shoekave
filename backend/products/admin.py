from django.contrib import admin
from .models import Brand, Category, Product, ProductImage, ProductSize,Order, OrderItem


# Register your models here.
admin.site.register(ProductImage)
admin.site.register(Product)
admin.site.register(Brand)
admin.site.register(Category)
admin.site.register(ProductSize)
admin.site.register(Order)
admin.site.register(OrderItem)