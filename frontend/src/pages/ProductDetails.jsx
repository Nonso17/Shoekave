import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MEDIA_URL } from "../api/api";

function ProductDetails({ products, addToCart }) {

  const { id } = useParams();

  const navigate = useNavigate();

  const [selectedSize, setSelectedSize] = useState(null);


  const product = products.find(
    (item) => item.id === Number(id)
  );


  if (!product) {
    return (
      <div className="container">
        <h2>Product not found</h2>
      </div>
    );
  }



  const handleAddToCart = () => {

    if (!selectedSize) {
      alert("Please select a size");
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


          {/* Image */}

          <div className="details-image">

            <img
              src={
                product.images?.[0]?.image.startsWith("http")
                  ? product.images[0].image
                  : `${MEDIA_URL}${product.images[0].image}`
              }
              alt={product.name}
            />

          </div>




          {/* Info */}

          <div className="details-info">


            <p className="product-brand">
              {product.brand}
            </p>



            <h1>
              {product.name}
            </h1>



            <p className="product-price">
              ₦ {Number(product.price).toLocaleString()}
            </p>



            <p>
              {product.description}
            </p>




            <h3>
              Select Size
            </h3>



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