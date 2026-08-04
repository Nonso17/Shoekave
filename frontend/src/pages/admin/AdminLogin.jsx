import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";

function AdminLogin() {
  const navigate = useNavigate();
  const { user, saveAuthTokens } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        await saveAuthTokens(response.data.tokens);
        toast.success("Admin authenticated successfully!");
        navigate("/admin");
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
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="admin_password"
                id="admin_password"
                required
                className="form-control"
                placeholder="Enter password"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#666"
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
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