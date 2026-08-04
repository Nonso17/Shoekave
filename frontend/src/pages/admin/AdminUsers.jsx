import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../api/api";
import ConfirmModal from "../../components/ConfirmModal";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", confirmLabel: "", variant: "danger", onConfirm: () => {} });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (showToast = false) => {
    try {
      setLoading(true);
      const res = await api.get("admin/users/");
      setUsers(res.data);
      if (showToast === true) {
        toast.info("Users list refreshed.");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users list.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStaff = (user) => {
    const newStatus = !user.is_staff;
    const confirmMsg = newStatus
      ? `Grant Admin privileges to ${user.email}?`
      : `Revoke Admin privileges from ${user.email}?`;
    setConfirmModal({
      isOpen: true,
      title: newStatus ? "Grant Admin Privileges" : "Revoke Admin Privileges",
      message: confirmMsg,
      confirmLabel: newStatus ? "Grant" : "Revoke",
      variant: newStatus ? "primary" : "warning",
      onConfirm: () => executeToggleStaff(user, newStatus),
    });
  };

  const executeToggleStaff = async (user, newStatus) => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    setActionLoadingId(user.id);
    try {
      const res = await api.patch(`admin/users/${user.id}/`, {
        is_staff: newStatus,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_staff: res.data.is_staff } : u))
      );
      toast.success(newStatus ? `Granted Admin role to ${user.email}.` : `Revoked Admin role from ${user.email}.`);
    } catch (err) {
      console.error("Error updating user staff status:", err);
      toast.error(err.response?.data?.error || "Failed to update staff status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleActive = (user) => {
    const newStatus = !user.is_active;
    const confirmMsg = newStatus
      ? `Re-activate account for ${user.email}?`
      : `Suspend account for ${user.email}?`;
    setConfirmModal({
      isOpen: true,
      title: newStatus ? "Re-activate Account" : "Suspend Account",
      message: confirmMsg,
      confirmLabel: newStatus ? "Activate" : "Suspend",
      variant: newStatus ? "primary" : "warning",
      onConfirm: () => executeToggleActive(user, newStatus),
    });
  };

  const executeToggleActive = async (user, newStatus) => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    setActionLoadingId(user.id);
    try {
      const res = await api.patch(`admin/users/${user.id}/`, {
        is_active: newStatus,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: res.data.is_active } : u))
      );
      toast.success(newStatus ? `Account for ${user.email} reactivated.` : `Account for ${user.email} suspended.`);
    } catch (err) {
      console.error("Error updating user active status:", err);
      toast.error(err.response?.data?.error || "Failed to update active status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = (user) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete User Account",
      message: `Permanently delete account for "${user.email}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: () => executeDeleteUser(user),
    });
  };

  const executeDeleteUser = async (user) => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    setActionLoadingId(user.id);
    try {
      await api.delete(`admin/users/${user.id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success(`User account ${user.email} deleted successfully.`);
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(err.response?.data?.error || "Failed to delete user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2>User Management</h2>
          <p className="admin-subtitle">Manage customer accounts, admin roles, and active permissions</p>
        </div>
        <button className="admin-btn secondary" onClick={() => fetchUsers(true)}>
          🔄 Refresh Users
        </button>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="toolbar-search">
          <input
            type="text"
            className="admin-input search"
            placeholder="🔍 Search users by name or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="admin-loading">Loading Users List...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="admin-empty">No user accounts found matching your search.</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Customer User";
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="table-user-info">
                        <div className="user-avatar-circle">
                          {(user.first_name ? user.first_name[0] : user.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <strong className="table-user-name">{fullName}</strong>
                          <div className="table-user-id">User ID: #{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.is_staff ? "admin" : "customer"}`}>
                        {user.is_staff ? "⭐ Admin" : "👤 Customer"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${user.is_active ? "active" : "inactive"}`}>
                        {user.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td>
                      {user.date_joined
                        ? new Date(user.date_joined).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className={`admin-btn-sm ${user.is_staff ? "secondary" : "primary"}`}
                          disabled={actionLoadingId === user.id}
                          onClick={() => handleToggleStaff(user)}
                        >
                          {user.is_staff ? "Revoke Admin" : "Make Admin"}
                        </button>
                        <button
                          className={`admin-btn-sm ${user.is_active ? "warning" : "success"}`}
                          disabled={actionLoadingId === user.id}
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.is_active ? "Suspend" : "Activate"}
                        </button>
                        <button
                          className="admin-btn-sm danger"
                          disabled={actionLoadingId === user.id}
                          onClick={() => handleDeleteUser(user)}
                          title="Delete User"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default AdminUsers;
