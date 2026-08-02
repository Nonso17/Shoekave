import React, { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api, { MEDIA_URL } from "../api/api";
import { OrderSkeleton } from "../components/LoadingStates";

const STATUS_TABS = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function Profile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("products/orders/");
        setOrders(response.data);
      } catch (error) {
        console.error("Fetch orders error:", error.response?.data);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (user && !user.is_staff) {
      fetchOrders();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container" style={{ padding: "4rem 1rem", textAlign: "center" }}>
        <h2>Please login to view your profile.</h2>
        <button className="btn btn-accent" style={{ marginTop: "1rem" }} onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  if (user.is_staff) {
    return <Navigate to="/admin" replace />;
  }

  const userInitial = user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "delivered";
      case "shipped": return "shipped";
      case "processing": return "processing";
      case "cancelled": return "cancelled";
      default: return "pending";
    }
  };

  // Helper for Order Progress Tracker steps
  const getStepStatus = (orderStatus, stepName) => {
    const statusMap = {
      pending: 1,
      processing: 2,
      shipped: 3,
      delivered: 4,
      cancelled: -1,
    };

    const currentStep = statusMap[orderStatus?.toLowerCase()] || 1;
    if (currentStep === -1) return "cancelled";

    const stepMap = {
      placed: 1,
      processing: 2,
      shipped: 3,
      delivered: 4,
    };

    const stepLevel = stepMap[stepName];

    if (currentStep > stepLevel) return "completed";
    if (currentStep === stepLevel) return "active";
    return "upcoming";
  };

  // Order status counts
  const getCountByStatus = (tab) => {
    if (tab === "All") return orders.length;
    return orders.filter((o) => o.status?.toLowerCase() === tab.toLowerCase()).length;
  };

  // Filtered orders
  const filteredOrders = activeTab === "All"
    ? orders
    : orders.filter((o) => o.status?.toLowerCase() === activeTab.toLowerCase());

  // Statistics
  const totalOrdersCount = orders.length;
  const inProgressCount = orders.filter((o) => ["pending", "processing", "shipped"].includes(o.status?.toLowerCase())).length;
  const deliveredCount = orders.filter((o) => o.status?.toLowerCase() === "delivered").length;

  return (
    <div className="profile-page animate-fade-in">
      <div className="container profile-container">
        
        {/* User Header Banner */}
        <div className="profile-header-banner">
          <div className="profile-avatar-large">
            {userInitial}
          </div>
          <div className="profile-header-info">
            <h1>{user.first_name} {user.last_name}</h1>
            <div className="profile-header-email">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              {user.email}
            </div>
          </div>
        </div>

        {/* Account Details Tiles */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h2 className="profile-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Account Overview
          </h2>

          <div className="profile-details-grid">
            <div className="profile-detail-card">
              <div className="profile-detail-label">First Name</div>
              <div className="profile-detail-value">{user.first_name || "—"}</div>
            </div>

            <div className="profile-detail-card">
              <div className="profile-detail-label">Last Name</div>
              <div className="profile-detail-value">{user.last_name || "Not provided"}</div>
            </div>

            <div className="profile-detail-card">
              <div className="profile-detail-label">Email Address</div>
              <div className="profile-detail-value">{user.email}</div>
            </div>

            <div className="profile-detail-card">
              <div className="profile-detail-label">Account Type</div>
              <div className="profile-detail-value" style={{ color: "var(--accent-color)" }}>Customer</div>
            </div>
          </div>
        </div>

        {/* My Orders Section */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <h2 className="profile-section-title" style={{ margin: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              My Orders & Status ({orders.length})
            </h2>
          </div>

          {/* Quick Metrics Cards */}
          {!loadingOrders && orders.length > 0 && (
            <div className="profile-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="profile-stat-box" style={{ background: "var(--bg-secondary)", padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block" }}>Total Purchases</span>
                <strong style={{ fontSize: "1.75rem", color: "var(--text-primary)", fontWeight: 700 }}>{totalOrdersCount}</strong>
              </div>

              <div className="profile-stat-box" style={{ background: "var(--bg-secondary)", padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block" }}>In Progress / Active</span>
                <strong style={{ fontSize: "1.75rem", color: "#3b82f6", fontWeight: 700 }}>{inProgressCount}</strong>
              </div>

              <div className="profile-stat-box" style={{ background: "var(--bg-secondary)", padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block" }}>Delivered & Completed</span>
                <strong style={{ fontSize: "1.75rem", color: "#10b981", fontWeight: 700 }}>{deliveredCount}</strong>
              </div>
            </div>
          )}

          {/* Status Filter Tabs */}
          {!loadingOrders && orders.length > 0 && (
            <div className="order-status-tabs" style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
              {STATUS_TABS.map((tab) => {
                const count = getCountByStatus(tab);
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`order-tab-btn ${isActive ? "active" : ""}`}
                    style={{
                      padding: "0.55rem 1.1rem",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      border: "1px solid",
                      borderColor: isActive ? "var(--accent-color)" : "var(--border-color)",
                      background: isActive ? "var(--accent-color)" : "var(--bg-secondary)",
                      color: isActive ? "#ffffff" : "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span>{tab}</span>
                    <span
                      style={{
                        background: isActive ? "rgba(255,255,255,0.25)" : "var(--bg-primary)",
                        color: isActive ? "#ffffff" : "var(--text-secondary)",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 700
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}


          {loadingOrders ? (
            <OrderSkeleton count={3} />
          ) : orders.length === 0 ? (
            <div className="orders-empty-card">
              <div className="orders-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>No Orders Placed Yet</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>You haven't made any purchases with Shoekave yet.</p>
              <button className="btn btn-accent" onClick={() => navigate("/")}>
                Start Shopping Now
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="orders-empty-card" style={{ padding: "2.5rem 1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>No {activeTab} Orders Found</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>You currently don't have any orders with status "{activeTab}".</p>
              <button className="btn btn-secondary" onClick={() => setActiveTab("All")}>
                View All Orders ({orders.length})
              </button>
            </div>
          ) : (
            <div className="orders-list-wrap">
              {filteredOrders.map((order) => {
                const createdDate = order.created_at
                  ? new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Recent";

                const isCancelled = order.status?.toLowerCase() === "cancelled";

                return (
                  <div key={order.id} className="order-card-modern">
                    
                    {/* Header */}
                    <div className="order-card-header">
                      <div className="order-header-left">
                        <span className="order-id-tag">Order #{order.id}</span>
                        <span className="order-date-tag">• {createdDate}</span>
                      </div>

                      <div className="order-header-right">
                        <span className="order-payment-method-tag">
                          {order.payment_method === "Card" ? "Paystack Card" : (order.payment_method || "Paystack")}
                        </span>
                        <span className={`order-status-badge ${getStatusBadgeClass(order.status)}`}>
                          ● {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Order Progress Timeline Tracker */}
                    {!isCancelled ? (
                      <div className="order-progress-tracker" style={{ padding: "1.25rem 1.5rem", background: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                          
                          {/* Progress Line */}
                          <div
                            style={{
                              position: "absolute",
                              top: "14px",
                              left: "10%",
                              right: "10%",
                              height: "3px",
                              background: "var(--border-color)",
                              zIndex: 1,
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                background: "var(--accent-color)",
                                width: order.status?.toLowerCase() === "delivered" ? "100%" : order.status?.toLowerCase() === "shipped" ? "66%" : order.status?.toLowerCase() === "processing" ? "33%" : "0%",
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>

                          {/* Step 1: Placed */}
                          <div className={`progress-step ${getStepStatus(order.status, "placed")}`} style={{ textAlign: "center", zIndex: 2, position: "relative" }}>
                            <div className="step-node">✓</div>
                            <span className="step-label">Order Placed</span>
                          </div>

                          {/* Step 2: Processing */}
                          <div className={`progress-step ${getStepStatus(order.status, "processing")}`} style={{ textAlign: "center", zIndex: 2, position: "relative" }}>
                            <div className="step-node">{getStepStatus(order.status, "processing") === "completed" ? "✓" : "2"}</div>
                            <span className="step-label">Processing</span>
                          </div>

                          {/* Step 3: Shipped */}
                          <div className={`progress-step ${getStepStatus(order.status, "shipped")}`} style={{ textAlign: "center", zIndex: 2, position: "relative" }}>
                            <div className="step-node">{getStepStatus(order.status, "shipped") === "completed" ? "✓" : "3"}</div>
                            <span className="step-label">Shipped</span>
                          </div>

                          {/* Step 4: Delivered */}
                          <div className={`progress-step ${getStepStatus(order.status, "delivered")}`} style={{ textAlign: "center", zIndex: 2, position: "relative" }}>
                            <div className="step-node">{getStepStatus(order.status, "delivered") === "completed" ? "✓" : "4"}</div>
                            <span className="step-label">Delivered</span>
                          </div>

                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "0.85rem 1.5rem", background: "rgba(239, 68, 68, 0.08)", borderBottom: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", fontSize: "0.88rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        This order was cancelled. Please contact support if you need assistance.
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="order-items-grid">
                      {order.items && order.items.map((item) => (
                        <div key={item.id} className="order-item-row">
                          <div className="order-item-thumb-wrap">
                            <img
                              src={
                                item.product_image
                                  ? (item.product_image.startsWith("http") ? item.product_image : `${MEDIA_URL}${item.product_image}`)
                                  : "/placeholder.png"
                              }
                              alt={item.product_name}
                              className="order-item-thumb"
                            />
                          </div>

                          <div className="order-item-details">
                            <div className="order-item-title">{item.product_name}</div>
                            <div className="order-item-tags">
                              <span className="order-item-tag">Size: EU {item.size}</span>
                              <span className="order-item-tag">Qty: {item.quantity}</span>
                            </div>
                          </div>

                          <div className="order-item-price-calc">
                            ₦ {Number(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="order-card-footer">
                      <div className="order-shipping-summary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>{order.shipping_address || `${order.city || "Standard Delivery"}`}</span>
                      </div>

                      <div className="order-total-sum">
                        <span className="order-total-label">Total Amount:</span>
                        <span className="order-total-amount">₦ {Number(order.total_amount).toLocaleString()}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Profile;