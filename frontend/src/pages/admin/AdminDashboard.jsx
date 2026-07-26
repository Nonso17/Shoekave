import React, { useState, useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import AdminProducts from "./AdminProducts";
import AdminOrders from "./AdminOrders";
import AdminUsers from "./AdminUsers";

function AdminDashboard() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products"); // "products", "orders", "users"

  if (loading) {
    return <div className="admin-loading" style={{ textAlign: "center", padding: "60px" }}>Loading Admin Control Center...</div>;
  }

  if (!user || !user.is_staff) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleAdminLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-dashboard-container">
      {/* Top Header Banner */}
      <div className="admin-dashboard-header">
        <div className="admin-header-main">
          <h1>Shoekave Admin Control Center</h1>
          <p>Logged in as: <strong>{user?.email || "Admin"}</strong></p>
        </div>
        <button
          className="admin-btn secondary"
          onClick={handleAdminLogout}
        >
          🚪 Logout Staff
        </button>
      </div>

      {/* Main Tab Navigation */}
      <div className="admin-nav-tabs">
        <button
          className={`admin-nav-tab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          👟 Products & Stock Editor
        </button>

        <button
          className={`admin-nav-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          📦 Orders Management
        </button>

        <button
          className={`admin-nav-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 User Management
        </button>
      </div>

      {/* Active Tab Content Area */}
      <div className="admin-tab-content animate-fade-in">
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "users" && <AdminUsers />}
      </div>
    </div>
  );
}

export default AdminDashboard;