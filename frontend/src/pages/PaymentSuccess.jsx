import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/api";

function PaymentSuccess({ clearCart }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = params.get("reference") || params.get("trxref");

      if (!reference) {
        setVerifying(false);
        setErrorMsg("No payment reference was found in the URL.");
        return;
      }

      try {
        const response = await api.get(`products/payment/verify/${reference}/`);
        console.log("Paystack verification response:", response.data);

        if (response.data?.status && response.data?.data?.status === "success") {
          setSuccess(true);
          setPaymentData(response.data.data);
          if (clearCart) clearCart();
        } else {
          setSuccess(false);
          setErrorMsg(
            response.data?.data?.gateway_response ||
            response.data?.message ||
            "Payment verification was unsuccessful."
          );
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setErrorMsg(
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to verify transaction with server."
        );
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [params, clearCart]);

  const formattedDate = paymentData?.paid_at || paymentData?.paidAt
    ? new Date(paymentData.paid_at || paymentData.paidAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="payment-success-wrapper animate-fade-in">
      <div className="payment-success-card">
        
        {verifying && (
          <div>
            <div className="payment-status-icon-wrap loading">
              <div className="checkout-spinner" style={{ width: "40px", height: "40px", borderTopColor: "#3b82f6" }}></div>
            </div>
            <h1 className="payment-success-title">Verifying Payment</h1>
            <p className="payment-success-subtitle">Please wait while we confirm your transaction details with Paystack...</p>
          </div>
        )}

        {!verifying && success && (
          <div>
            <div className="payment-status-icon-wrap success">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            
            <h1 className="payment-success-title">Payment Successful!</h1>
            <p className="payment-success-subtitle">
              Thank you for your purchase. Your payment was verified and your order is confirmed.
            </p>

            <div className="payment-receipt-box">
              <div className="receipt-row">
                <span className="receipt-label">Payment Status</span>
                <span className="receipt-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Verified & Paid
                </span>
              </div>

              {paymentData && (
                <>
                  <div className="receipt-row">
                    <span className="receipt-label">Transaction Reference</span>
                    <span className="receipt-value mono">{paymentData.reference}</span>
                  </div>

                  <div className="receipt-row">
                    <span className="receipt-label">Amount Paid</span>
                    <span className="receipt-value highlight">₦ {(paymentData.amount / 100).toLocaleString()}</span>
                  </div>

                  <div className="receipt-row">
                    <span className="receipt-label">Payment Channel</span>
                    <span className="receipt-value" style={{ textTransform: "capitalize" }}>
                      Paystack {paymentData.channel || "Card"}
                    </span>
                  </div>

                  <div className="receipt-row">
                    <span className="receipt-label">Date & Time</span>
                    <span className="receipt-value">{formattedDate}</span>
                  </div>
                </>
              )}
            </div>

            <div className="payment-action-buttons">
              <button className="btn btn-accent" onClick={() => navigate("/profile")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "0.4rem" }}>
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                </svg>
                View My Orders
              </button>
              <button className="btn btn-secondary" onClick={() => navigate("/")} style={{ border: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        {!verifying && !success && (
          <div>
            <div className="payment-status-icon-wrap error">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>

            <h1 className="payment-success-title">Verification Failed</h1>
            <p className="payment-success-subtitle" style={{ color: "#ef4444" }}>{errorMsg}</p>

            <div className="payment-action-buttons">
              <button className="btn btn-accent" onClick={() => navigate("/checkout")}>
                Return to Checkout
              </button>
              <button className="btn btn-secondary" onClick={() => navigate("/")} style={{ border: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
                Back to Home
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PaymentSuccess;