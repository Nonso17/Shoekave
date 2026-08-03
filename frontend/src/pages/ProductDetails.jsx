import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import api, { MEDIA_URL } from "../api/api";
import {
  ProductDetailsSkeleton,
} from "../components/LoadingStates";

function ProductDetails({ addToCart }) {
  const { id } = useParams();

  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);

      try {
        const response = await api.get(`products/${id}/`);
        setProduct(response.data);
      } catch (error) {
        console.error(error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (!product) {
    return (
      <div
        className="container"
        style={{
          padding: "4rem 1rem",
          textAlign: "center",
        }}
      >
        <h2>Product not found</h2>

        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "0.5rem",
          }}
        >
          The requested shoe listing could not be found.
        </p>

        <button
          className="btn btn-accent"
          style={{ marginTop: "1rem" }}
          onClick={() => navigate("/")}
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.warn("Please select a size");
      return;
    }

    addToCart({
      ...product,
      selectedSize,
    });

    navigate("/cart");
  };

  return (
    <div className="product-details animate-fade-in">
      <div className="container">
        <div className="details-grid">
          <div className="details-image">
            <img
              src={
                product.images?.[0]?.image
                  ? product.images[0].image.startsWith("http")
                    ? product.images[0].image
                    : `${MEDIA_URL}${product.images[0].image}`
                  : "/placeholder.png"
              }
              alt={product.name}
            />
          </div>

          <div className="details-info">
            <p className="product-brand">
              {product.brand}
            </p>

            <h1>{product.name}</h1>

            <p className="product-price">
              ₦ {Number(product.price).toLocaleString()}
            </p>

            <p>{product.description}</p>

            <h3>Select Size</h3>

            <div className="sizes">
              {product.sizes.map((item) => (
                <button
                  key={item.size}
                  disabled={item.stock === 0}
                  className={
                    selectedSize === item.size
                      ? "size active"
                      : "size"
                  }
                  onClick={() =>
                    setSelectedSize(item.size)
                  }
                >
                  {item.size}
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary"
              disabled={!product.available}
              onClick={handleAddToCart}
            >
              {product.available
                ? "Add to Cart"
                : "Out of Stock"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;