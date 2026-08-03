from cloudinary.cache.responsive_breakpoints_cache import instance
from rest_framework import serializers
from .models import Product, ProductImage, ProductSize, Brand, Category, Order, OrderItem

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
            return obj.image.url
        return None

class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = [
            "id",
            "size",
            "stock",
        ]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(
        many=True,
        read_only=True
    )
    sizes = ProductSizeSerializer(
        many=True,
        read_only=True
    )

    brand = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
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
        return obj.sizes.filter(stock__gt=0).exists()

    def to_representation(self, instance):
        rep = super().to_representation(instance)

        rep["brand"] = instance.brand.name if instance.brand else ""
        rep["category"] = instance.category.name if instance.category else ""

        rep["stock"] = sum(
            size.stock for size in instance.sizes.all()
        )

        return rep

    def create(self, validated_data):
        sizes_data = validated_data.pop("sizes", [])
        brand_name = validated_data.pop("brand", "General").strip() or "General"
        category_name = validated_data.pop("category", "Shoes").strip() or "Shoes"

        brand_obj, _ = Brand.objects.get_or_create(name=brand_name)
        category_obj, _ = Category.objects.get_or_create(name=category_name)

        validated_data["brand"] = brand_obj
        validated_data["category"] = category_obj

        product = Product.objects.create(**validated_data)

        # Handle sizes 40-46 default setup
        total_stock = 0
        sizes_dict = {item.get("size"): item.get("stock", 0) for item in sizes_data if "size" in item}
        
        for size_val in range(40, 47):
            stock_qty = sizes_dict.get(size_val, 0)
            ProductSize.objects.create(product=product, size=size_val, stock=stock_qty)
            total_stock += stock_qty

        product.stock = total_stock
        product.save()

        return product

    def update(self, instance, validated_data):
        sizes_data = validated_data.pop("sizes", None)
        brand_name = validated_data.pop("brand", None)
        category_name = validated_data.pop("category", None)

        if brand_name is not None:
            brand_name = brand_name.strip() or "General"
            brand_obj, _ = Brand.objects.get_or_create(name=brand_name)
            instance.brand = brand_obj

        if category_name is not None:
            category_name = category_name.strip() or "Shoes"
            category_obj, _ = Category.objects.get_or_create(name=category_name)
            instance.category = category_obj

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if sizes_data is not None:
            total_stock = 0
            for size_item in sizes_data:
                size_val = size_item.get("size")
                stock_qty = size_item.get("stock", 0)
                if size_val in range(40, 47):
                    ProductSize.objects.update_or_create(
                        product=instance,
                        size=size_val,
                        defaults={"stock": stock_qty}
                    )
            # recalculate total stock from size table
            for ps in instance.sizes.all():
                total_stock += ps.stock
            instance.stock = total_stock

        instance.save()
        return instance


class OrderItemSerializer(serializers.ModelSerializer):
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
        first_img = obj.product.images.first()
        if first_img:
            return first_img.image.url
        return None


class OrderSerializer(serializers.ModelSerializer):
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
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name if name else obj.user.email

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        user = self.context["request"].user

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
