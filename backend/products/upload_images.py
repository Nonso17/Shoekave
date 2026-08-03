import os

import cloudinary.uploader
from products.models import ProductImage


# Root folder containing your six brand folders
IMAGE_ROOT = r"C:\Users\HP\Desktop\shoekave images"


def find_image(filename):
    """
    Search every subfolder for a file with the same
    name, ignoring the extension.
    """
    base_name = os.path.splitext(filename)[0]

    for root, _, files in os.walk(IMAGE_ROOT):
        for file in files:
            if os.path.splitext(file)[0] == base_name:
                return os.path.join(root, file)

    return None


def upload_all_images():
    uploaded = 0
    missing = 0

    for product_image in ProductImage.objects.all():

        filename = os.path.basename(str(product_image.image))

        print(f"Looking for: {filename}")

        local_path = find_image(filename)

        if not local_path:
            print(f"❌ Missing: {filename}")
            missing += 1
            continue

        print(f"⬆ Uploading: {local_path}")

        result = cloudinary.uploader.upload(
            local_path,
            folder="products",
            overwrite=True,
        )

        product_image.image = result["public_id"]
        product_image.save(update_fields=["image"])

        uploaded += 1

    print("\n========================")
    print("Upload Complete")
    print("========================")
    print(f"Uploaded: {uploaded}")
    print(f"Missing : {missing}")