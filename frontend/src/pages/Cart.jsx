import React from "react";
import { useNavigate } from "react-router-dom";
import { MEDIA_URL } from "../api/api";

function Cart({
  cart,
  cartTotal,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
}) {
  const navigate = useNavigate();

  return (
    <div className="cart-page animate-fade-in">
      <div className="container">

        <h1 style={{ marginBottom: "2rem" }}>
          Your Cart
        </h1>


        {cart.length === 0 ? (

          <div className="empty-cart">

            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: "0 auto 1rem", opacity: 0.5 }}
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>


            <p>
              Your cart is currently empty.
            </p>


            <button
              className="btn btn-primary"
              onClick={() => navigate("/")}
            >
              Continue Shopping
            </button>

          </div>


        ) : (


          <div className="cart-layout">


            <div className="cart-items-container">

              {cart.map((item, idx) => (

                <div
                  key={idx}
                  className="cart-item"
                >

                  <img
                    src={
                      item.images?.length > 0
                        ? `${MEDIA_URL}${item.images[0].image}`
                        : "/placeholder.png"
                    }
                    alt={item.name}
                    className="cart-item-img"
                  />



                  <div className="cart-item-details">

                    <h3 className="cart-item-name">
                      {item.name}
                    </h3>


                    <p>
                      Size: {item.selectedSize}
                    </p>


                    <div className="quantity-control">

  <button
    onClick={() => decreaseQuantity(idx)}
  >
    -
  </button>


  <span>
    {item.quantity}
  </span>


  <button
    onClick={() => increaseQuantity(idx)}
  >
    +
  </button>

</div>


                    <p className="cart-item-price">
                      ₦ {Number(item.price).toLocaleString()}
                    </p>


                  </div>



                  <button
                    className="btn-remove"
                    onClick={() => removeFromCart(idx)}
                  >
                    Remove
                  </button>


                </div>

              ))}

            </div>




            <div className="order-summary">

              <h3>
                Order Summary
              </h3>



              <div className="summary-row">

                <span>
                  Subtotal
                </span>

                <span>
                  ₦ {Number(cartTotal).toLocaleString()}
                </span>

              </div>




              <div className="summary-row">

                <span>
                  Shipping
                </span>

                <span>
                  Calculated at checkout
                </span>

              </div>




              <div className="summary-total">

                <span>
                  Total
                </span>

                <span>
                  ₦ {Number(cartTotal).toLocaleString()}
                </span>

              </div>




              <button
                className="btn btn-accent btn-checkout"
              >
                Proceed to Checkout
              </button>


            </div>


          </div>


        )}

      </div>
    </div>
  );
}

export default Cart;