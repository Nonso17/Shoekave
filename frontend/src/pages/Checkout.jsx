import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { MEDIA_URL } from "../api/api";
import { AuthContext } from "../context/AuthContext";

function Checkout({ cart = [], cartTotal = 0, clearCart }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    fullName: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "",
    phone: "",
    address: "",
    city: "",
    state: "",
    paymentMethod: "Card",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const placeOrder = async (e) => {
    if (e) e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      setErrorMsg("Your cart is empty. Please add items to checkout.");
      return;
    }

    if (!formData.address.trim() || !formData.phone.trim() || !formData.city.trim()) {
      setErrorMsg("Please fill in all required shipping details (Address, City, Phone).");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const orderData = {
        total_amount: cartTotal,
        shipping_address: `${formData.address}, ${formData.city}${formData.state ? `, ${formData.state}` : ""}`,
        phone_number: formData.phone,
        city: formData.city,
        payment_method: "Card",
        items: cart.map((item) => ({
          product: item.id,
          size: item.selectedSize,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const response = await api.post("products/checkout/", orderData);
      console.log("Order created successfully:", response.data);

      setSuccessMsg("Order created! Redirecting to Paystack payment gateway...");
      const initRes = await api.post("products/payment/initialize/", {
        amount: cartTotal,
        order_id: response.data?.id,
        callback_url: `${window.location.origin}/payment/success`,
      });

      if (initRes.data && initRes.data.status && initRes.data.data?.authorization_url) {
        window.location.href = initRes.data.data.authorization_url;
        return;
      } else {
        setErrorMsg(initRes.data?.message || "Failed to initialize Paystack payment. Please try again.");
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Order submission error:", error.response?.data || error.message);
      const serverErr = error.response?.data?.error || error.response?.data?.detail || "Order submission failed. Please try again.";
      setErrorMsg(serverErr);
      setLoading(false);
    }
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="checkout-page animate-fade-in">
        <div className="container">
          <div className="checkout-empty-card">
            <div className="checkout-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <h2>Your Cart is Empty</h2>
            <p>You need to add items to your cart before proceeding to checkout.</p>
            <button className="btn btn-accent" onClick={() => navigate("/")}>
              Explore Collection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page animate-fade-in">
      <div className="container">
        
        {/* Header with Navigation & Progress Steps */}
        <div className="checkout-header">
          <button className="checkout-back-btn" onClick={() => navigate("/cart")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back to Cart
          </button>
          <div className="checkout-title-wrap">
            <h1>Checkout</h1>
            <p className="checkout-subtitle">Complete your order details & delivery preferences</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="checkout-steps">
          <div className="checkout-step completed">
            <span className="step-num">✓</span>
            <span className="step-label">Cart</span>
          </div>
          <div className="step-divider"></div>
          <div className="checkout-step active">
            <span className="step-num">2</span>
            <span className="step-label">Shipping & Payment</span>
          </div>
          <div className="step-divider"></div>
          <div className="checkout-step">
            <span className="step-num">3</span>
            <span className="step-label">Confirmation</span>
          </div>
        </div>

        {/* Alert Banners */}
        {errorMsg && (
          <div className="checkout-alert checkout-alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="checkout-alert checkout-alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={placeOrder} className="checkout-layout">
          
          {/* Left Column — Shipping Info */}
          <div className="checkout-main-content">
            
            {/* Shipping Information Panel */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <div className="checkout-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <h2>Shipping & Contact Information</h2>
              </div>

              <div className="checkout-form-grid">
                <div className="form-group full-width">
                  <label className="form-label" htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    className="form-control"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-control"
                    placeholder="+234 800 000 0000"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="city">City / Town *</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Lagos, Abuja"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label" htmlFor="address">Delivery Address *</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    className="form-control"
                    placeholder="House number, street name, apartment or suite"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label" htmlFor="state">State / Region</label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Lagos State"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Order Items Panel */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <div className="checkout-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
                <h2>Order Items ({cart.length})</h2>
              </div>

              <div className="checkout-items-list">
                {cart.map((item, index) => (
                  <div key={index} className="checkout-item">
                    <div className="checkout-item-img-wrap">
                      <img
                        src={
                          item.images?.length > 0
                            ? (item.images[0].image.startsWith("http") ? item.images[0].image : `${MEDIA_URL}${item.images[0].image}`)
                            : "/placeholder.png"
                        }
                        alt={item.name}
                        className="checkout-item-img"
                      />
                    </div>
                    <div className="checkout-item-info">
                      <p className="checkout-item-name">{item.name}</p>
                      <div className="checkout-item-meta">
                        <span className="checkout-meta-tag">Size: {item.selectedSize}</span>
                        <span className="checkout-meta-tag">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="checkout-item-price-wrap">
                      <p className="checkout-item-price">
                        ₦ {Number(item.price * item.quantity).toLocaleString()}
                      </p>
                      {item.quantity > 1 && (
                        <span className="checkout-unit-price">
                          (₦ {Number(item.price).toLocaleString()} each)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column — Payment Summary Panel */}
          <div className="checkout-sidebar">
            <div className="checkout-summary-panel">
              <h2 className="checkout-panel-title">Order Summary</h2>

              <div className="checkout-summary-rows">
                <div className="checkout-summary-row">
                  <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>₦ {Number(cartTotal).toLocaleString()}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Estimated Shipping</span>
                  <span className="checkout-free-tag">FREE</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Estimated Tax</span>
                  <span>₦ 0.00</span>
                </div>
              </div>

              <div className="checkout-summary-divider"></div>

              <div className="checkout-summary-total">
                <div>
                  <span className="total-label">Total Amount</span>
                  <span className="total-tax-note">Includes all taxes & fees</span>
                </div>
                <span className="total-value">₦ {Number(cartTotal).toLocaleString()}</span>
              </div>

              <button
                id="place-order-btn"
                type="submit"
                className="btn btn-accent checkout-place-order-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="checkout-spinner-wrap">
                    <span className="checkout-spinner"></span>
                    Connecting to Paystack...
                  </span>
                ) : (
                  <span className="checkout-btn-content">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Pay Now via Paystack
                  </span>
                )}
              </button>

              <div className="checkout-trust-badges">
                <div className="trust-badge-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>256-Bit SSL Encrypted</span>
                </div>
                <div className="trust-badge-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>100% Authentic Guarantee</span>
                </div>
              </div>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

export default Checkout;