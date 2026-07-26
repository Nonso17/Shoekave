import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api, { MEDIA_URL } from "../../api/api";

const STATUSES = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("products/admin/orders/");
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await api.patch(`products/admin/orders/${orderId}/`, {
        status: newStatus,
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: res.data.status } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: res.data.status }));
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats calculations
  const totalOrdersCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = activeStatus === "All" || o.status === activeStatus;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesQuery =
      String(o.id).includes(query) ||
      (o.user_name && o.user_name.toLowerCase().includes(query)) ||
      (o.user_email && o.user_email.toLowerCase().includes(query)) ||
      (o.phone_number && o.phone_number.includes(query)) ||
      (o.shipping_address && o.shipping_address.toLowerCase().includes(query)) ||
      (o.city && o.city.toLowerCase().includes(query));
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2>Order Management</h2>
          <p className="admin-subtitle">Track customer purchases, delivery info, and order status updates</p>
        </div>
        <button className="admin-btn secondary" onClick={fetchOrders}>
          🔄 Refresh Orders
        </button>
      </div>

      {/* Orders Metrics Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{totalOrdersCount}</div>
        </div>
        <div className="admin-stat-card highlight">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">₦ {totalRevenue.toLocaleString()}</div>
        </div>
        <div className="admin-stat-card warning">
          <div className="stat-label">Pending Orders</div>
          <div className="stat-value">{pendingCount}</div>
        </div>
        <div className="admin-stat-card success">
          <div className="stat-label">Delivered Orders</div>
          <div className="stat-value">{deliveredCount}</div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="admin-toolbar">
        <div className="toolbar-search">
          <input
            type="text"
            className="admin-input search"
            placeholder="🔍 Search by Order ID, Customer Name, Email, Phone, Address, City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="status-tabs">
          {STATUSES.map((statusItem) => (
            <button
              key={statusItem}
              className={`status-tab-btn ${activeStatus === statusItem ? "active" : ""}`}
              onClick={() => setActiveStatus(statusItem)}
            >
              {statusItem}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="admin-loading">Loading Orders List...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-empty">No orders found matching your search.</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer & Contact</th>
                <th>Delivery Details</th>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong className="order-id-badge">#{order.id}</strong>
                  </td>
                  <td>
                    <div className="customer-info">
                      <div className="customer-name" style={{ fontWeight: 600 }}>{order.user_name || "Customer"}</div>
                      <div className="customer-email" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{order.user_email}</div>
                      {order.phone_number && (
                        <div style={{ fontSize: "0.82rem", color: "var(--accent-color)", marginTop: "2px", fontWeight: 600 }}>
                          📞 {order.phone_number}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.85rem", maxWidth: "240px", lineHeight: "1.3" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        📍 {order.city || "Standard Delivery"}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {order.shipping_address || "No address provided"}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                    {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td>
                    <strong className="order-total-amount">
                      ₦ {Number(order.total_amount).toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    <span className="payment-method-badge">{order.payment_method || "Card"}</span>
                  </td>
                  <td>
                    <select
                      className={`status-select ${order.status.toLowerCase()}`}
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="admin-btn action-edit"
                      onClick={() => setSelectedOrder(order)}
                    >
                      👁️ View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed Order Items Modal */}
      {selectedOrder && createPortal(
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-content order-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
            <div className="admin-modal-header">
              <h2>Order #{selectedOrder.id} Full Details</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                &times;
              </button>
            </div>

            <div className="order-summary-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="order-summary-box" style={{ background: "var(--bg-primary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "var(--accent-color)", marginBottom: "0.75rem", fontSize: "0.95rem" }}>👤 Customer Information</h4>
                <p style={{ marginBottom: "0.4rem" }}><strong>Name:</strong> {selectedOrder.user_name || "N/A"}</p>
                <p style={{ marginBottom: "0.4rem" }}><strong>Email:</strong> {selectedOrder.user_email || "N/A"}</p>
                <p style={{ marginBottom: "0.4rem" }}><strong>Phone Number:</strong> <span style={{ color: "var(--accent-color)", fontWeight: 700 }}>{selectedOrder.phone_number || "Not provided"}</span></p>
              </div>

              <div className="order-summary-box" style={{ background: "var(--bg-primary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "var(--accent-color)", marginBottom: "0.75rem", fontSize: "0.95rem" }}>📍 Delivery & Payment</h4>
                <p style={{ marginBottom: "0.4rem" }}><strong>Delivery Address:</strong> {selectedOrder.shipping_address || "N/A"}</p>
                <p style={{ marginBottom: "0.4rem" }}><strong>City / Town:</strong> {selectedOrder.city || "N/A"}</p>
                <p style={{ marginBottom: "0.4rem" }}><strong>Payment Method:</strong> {selectedOrder.payment_method || "Card"}</p>
                <p style={{ marginBottom: "0.4rem" }}><strong>Status:</strong> <span className={`order-status-badge ${selectedOrder.status?.toLowerCase()}`}>{selectedOrder.status}</span></p>
              </div>
            </div>

            <h4 style={{ margin: "20px 0 10px 0", fontSize: "1rem" }}>📦 Purchased Items ({selectedOrder.items ? selectedOrder.items.length : 0})</h4>
            <div className="order-items-list">
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                selectedOrder.items.map((item, idx) => {
                  const imgUrl = item.product_image
                    ? item.product_image.startsWith("http")
                      ? item.product_image
                      : `${MEDIA_URL}${item.product_image}`
                    : "/placeholder.png";

                  return (
                    <div key={idx} className="order-item-card">
                      <img src={imgUrl} alt={item.product_name} className="order-item-thumb" />
                      <div className="order-item-details">
                        <div className="order-item-title">{item.product_name}</div>
                        <div className="order-item-meta">
                          <span>Size: <strong>EU {item.size}</strong></span>
                          <span>Quantity: <strong>{item.quantity}</strong></span>
                        </div>
                      </div>
                      <div className="order-item-price">
                        ₦ {(Number(item.price) * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>No item details available.</p>
              )}
            </div>

            <div className="order-modal-footer">
              <div className="order-modal-total">
                Total Order Amount: <strong>₦ {Number(selectedOrder.total_amount).toLocaleString()}</strong>
              </div>
              <button
                className="admin-btn primary"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminOrders;
