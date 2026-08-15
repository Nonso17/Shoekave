from rest_framework import serializers

from .models import (
    Product,
    ProductImage,
    ProductSize,
    Brand,
    Category,
    Order,
    OrderItem,
)


# ============================================================
# PRODUCT IMAGE SERIALIZER
# ============================================================

class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = [
            "id",
            "image",
            "alt_text",
        ]

    def get_image(self, obj):
        if obj.image:
            try:
                return obj.image.url
            except Exception:
                return str(obj.image)
        return None


# ============================================================
# PRODUCT SIZE SERIALIZER
# ============================================================

class ProductSizeSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductSize
        fields = [
            "id",
            "size",
            "stock",
        ]


# ============================================================
# PRODUCT SERIALIZER
# ============================================================

class ProductSerializer(serializers.ModelSerializer):

    images = ProductImageSerializer(
        many=True,
        read_only=True
    )

    sizes = ProductSizeSerializer(
        many=True,
        read_only=True
    )

    brand = serializers.CharField(
        required=False,
        allow_blank=True
    )

    category = serializers.CharField(
        required=False,
        allow_blank=True
    )

    available = serializers.SerializerMethodField()

    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "description",
            "brand",
            "category",
            "price",
            "stock",
            "images",
            "sizes",
            "available",
            "created_at",
            "updated_at",
        ]

    def get_available(self, obj):
        """
        Determine product availability using the already
        prefetched sizes when available.

        This avoids an additional database query for every
        product and avoids 500 errors when obj.sizes is evaluated.
        """
        sizes = obj.sizes.all()
        if sizes:
            return any(size.stock > 0 for size in sizes)
        return (obj.stock or 0) > 0

    def to_representation(self, instance):
        rep = super().to_representation(instance)

        rep["brand"] = (
            instance.brand.name
            if instance.brand
            else ""
        )

        rep["category"] = (
            instance.category.name
            if instance.category
            else ""
        )

        # Calculate total stock from individual sizes
        sizes = instance.sizes.all()
        if sizes:
            rep["stock"] = sum(size.stock for size in sizes)
        else:
            rep["stock"] = instance.stock or 0

        return rep

    def create(self, validated_data):

        sizes_data = validated_data.pop(
            "sizes",
            []
        )

        brand_name = (
            validated_data.pop(
                "brand",
                "General"
            ).strip()
            or "General"
        )

        category_name = (
            validated_data.pop(
                "category",
                "Shoes"
            ).strip()
            or "Shoes"
        )

        # Get or create brand
        brand_obj, _ = Brand.objects.get_or_create(
            name=brand_name
        )

        # Get or create category
        category_obj, _ = Category.objects.get_or_create(
            name=category_name
        )

        validated_data["brand"] = brand_obj
        validated_data["category"] = category_obj

        # Create product
        product = Product.objects.create(
            **validated_data
        )

        # Create sizes 40-46
        total_stock = 0

        sizes_dict = {
            item.get("size"): item.get("stock", 0)
            for item in sizes_data
            if "size" in item
        }

        for size_val in range(40, 47):

            stock_qty = sizes_dict.get(
                size_val,
                0
            )

            ProductSize.objects.create(
                product=product,
                size=size_val,
                stock=stock_qty
            )

            total_stock += stock_qty

        # Store total stock on product
        product.stock = total_stock
        product.save()

        return product

    def update(
        self,
        instance,
        validated_data
    ):

        sizes_data = validated_data.pop(
            "sizes",
            None
        )

        brand_name = validated_data.pop(
            "brand",
            None
        )

        category_name = validated_data.pop(
            "category",
            None
        )

        # Update brand
        if brand_name is not None:

            brand_name = (
                brand_name.strip()
                or "General"
            )

            brand_obj, _ = Brand.objects.get_or_create(
                name=brand_name
            )

            instance.brand = brand_obj

        # Update category
        if category_name is not None:

            category_name = (
                category_name.strip()
                or "Shoes"
            )

            category_obj, _ = Category.objects.get_or_create(
                name=category_name
            )

            instance.category = category_obj

        # Update normal product fields
        for attr, value in validated_data.items():
            setattr(
                instance,
                attr,
                value
            )

        # Update sizes
        if sizes_data is not None:

            total_stock = 0

            for size_item in sizes_data:

                size_val = size_item.get(
                    "size"
                )

                stock_qty = size_item.get(
                    "stock",
                    0
                )

                if size_val in range(40, 47):

                    ProductSize.objects.update_or_create(
                        product=instance,
                        size=size_val,
                        defaults={
                            "stock": stock_qty
                        }
                    )

            # Recalculate total stock
            for ps in instance.sizes.all():
                total_stock += ps.stock

            instance.stock = total_stock

        instance.save()

        return instance


# ============================================================
# ORDER ITEM SERIALIZER
# ============================================================

class OrderItemSerializer(
    serializers.ModelSerializer
):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem

        fields = (
            "id",
            "product",
            "product_name",
            "product_image",
            "size",
            "quantity",
            "price",
        )

    def get_product_image(self, obj):

        if hasattr(obj, "product") and obj.product:
            images = list(obj.product.images.all())
            if images and images[0].image:
                try:
                    return images[0].image.url
                except Exception:
                    return str(images[0].image)

        return None


# ============================================================
# ORDER SERIALIZER
# ============================================================

class OrderSerializer(
    serializers.ModelSerializer
):

    items = OrderItemSerializer(
        many=True
    )

    user_email = serializers.CharField(
        source="user.email",
        read_only=True
    )

    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Order

        fields = (
            "id",
            "user_email",
            "user_name",
            "total_amount",
            "shipping_address",
            "phone_number",
            "city",
            "payment_method",
            "status",
            "created_at",
            "items",
        )

    def get_user_name(self, obj):

        if not obj.user:
            return ""

        name = (
            f"{obj.user.first_name} "
            f"{obj.user.last_name}"
        ).strip()

        return (
            name
            if name
            else obj.user.email
        )

    def create(self, validated_data):

        items_data = validated_data.pop(
            "items"
        )

        user = self.context[
            "request"
        ].user

        order = Order.objects.create(
            user=user,
            **validated_data
        )

        for item in items_data:

            OrderItem.objects.create(
                order=order,
                **item
            )

        return order