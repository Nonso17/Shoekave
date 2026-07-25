from django.core.management.base import BaseCommand
from django.core.files import File

from products.models import (
    Product,
    ProductImage,
    ProductSize,
    Brand,
    Category
)

import os


BASE_FOLDER = r"C:\Users\HP\Desktop\shoekave\backend\media\products"


BRAND_CONFIG = {

    "Nike": {
        "price": 75000,
        "category": "Sneakers"
    },

    "Adidas Samba": {
        "price": 70000,
        "category": "Sneakers"
    },

    "Boots": {
        "price": 50000,
        "category": "Boots"
    },

    "Rick Owens": {
        "price": 100000,
        "category": "Sneakers"
    },

    "Timberland": {
        "price": 85000,
        "category": "Boots"
    },

    "New Balance": {
        "price": 80000,
        "category": "Sneakers"
    }

}



SIZES = [40,41,42,43,44,45,46]



class Command(BaseCommand):

    help = "Import shoes from folders"



    def handle(self, *args, **kwargs):

        for brand_name, data in BRAND_CONFIG.items():


            brand, _ = Brand.objects.get_or_create(
                name=brand_name
            )


            category, _ = Category.objects.get_or_create(
                name=data["category"]
            )


            folder = os.path.join(
                BASE_FOLDER,
                brand_name
            )


            if not os.path.exists(folder):

                self.stdout.write(
                    self.style.WARNING(
                        f"{folder} not found"
                    )
                )

                continue



            images = os.listdir(folder)


            count = 1


            for image_name in images:


                if not image_name.lower().endswith(
                    (".jpg", ".jpeg", ".png")
                ):
                    continue



                product = Product.objects.create(

                    name=f"{brand_name} Shoe {count}",

                    description=f"{brand_name} footwear",

                    brand=brand,

                    category=category,

                    price=data["price"],

                    stock=0

                )



                image_path = os.path.join(
                    folder,
                    image_name
                )



                with open(image_path, "rb") as img:


                    ProductImage.objects.create(

                        product=product,

                        image=File(
                            img,
                            name=image_name
                        ),

                        alt_text=product.name

                    )



                for size in SIZES:

                    ProductSize.objects.create(

                        product=product,

                        size=size,

                        stock=0

                    )



                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created {product.name}"
                    )
                )


                count += 1



        self.stdout.write(
            self.style.SUCCESS(
                "Import completed successfully"
            )
        )