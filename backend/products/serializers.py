from rest_framework import serializers
from .models import Product, ProductImage, ProductSize

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = [
            "id",
            "image",
            "alt_text",
        ]


class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = [
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

    brand = serializers.StringRelatedField()

    category = serializers.StringRelatedField()


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
        ]



    def get_available(self, obj):

        return obj.sizes.filter(
            stock__gt=0
        ).exists()