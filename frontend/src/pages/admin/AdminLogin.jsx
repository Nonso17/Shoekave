import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";

function AdminLogin() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.is_staff) {
      navigate("/admin");
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const response = await api.post("admin/login/", { email, password });

      if (response.data?.tokens) {
        localStorage.setItem("access", response.data.tokens.access);
        localStorage.setItem("refresh", response.data.tokens.refresh);
        toast.success("Admin authenticated successfully!");
        window.location.href = "/admin";
      }
    } catch (error) {
      console.error("Admin login error:", error.response?.data);
      const errMsg = error.response?.data?.error || "Admin authentication failed. Invalid credentials.";
      setErrorMsg(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.85rem",
              borderRadius: "var(--radius-full)",
              background: "var(--accent-light)",
              color: "var(--accent-color)",
              fontSize: "0.8rem",
              fontWeight: "700",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            🛡️ Admin Control Panel
          </span>
        </div>

        <h2 style={{ textAlign: "center" }}>Staff Access</h2>

        <p className="auth-subtitle">
          Sign in with administrator credentials to manage catalog & orders
        </p>

        {errorMsg && <div className="admin-alert error">{errorMsg}</div>}

        <form onSubmit={handleLogin} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              name="admin_email"
              id="admin_email"
              required
              className="form-control"
              placeholder="admin@shoekave.com"
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="admin_password"
              id="admin_password"
              required
              className="form-control"
              placeholder="Enter password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Log In to Control Center"}
          </button>

          <div className="auth-switch">
            Not a staff member?{" "}
            <Link to="/login" className="auth-switch-link">
              Customer Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;