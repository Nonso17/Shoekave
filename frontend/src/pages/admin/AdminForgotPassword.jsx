import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { Spinner } from "../../components/LoadingStates";

function AdminForgotPassword() {
  const navigate = useNavigate();
  const { saveAuthTokens } = useContext(AuthContext);

  const [step, setStep] = useState(1); // 1 = Request Code via Brevo, 2 = Confirm & Reset
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your administrator email address.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await api.post("accounts/admin/password-reset/request/", { email });
      const msg = response.data?.message || "Verification code dispatched via Brevo!";
      setSuccessMsg(msg);
      toast.success(msg);
      setStep(2);
    } catch (err) {
      console.error("Admin reset code request error:", err.response?.data);
      const errText = err.response?.data?.error || "Failed to send reset code. Please verify email address.";
      setErrorMsg(errText);
      toast.error(errText);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (!code || !newPassword) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await api.post("accounts/admin/password-reset/confirm/", {
        email,
        code,
        new_password: newPassword,
      });

      if (response.data?.tokens && saveAuthTokens) {
        await saveAuthTokens(response.data.tokens);
      }

      toast.success("Admin password reset successfully! Logging in...");
      setSuccessMsg("Admin password reset successfully! Redirecting to Control Center...");

      setTimeout(() => {
        navigate("/admin");
      }, 1200);
    } catch (err) {
      console.error("Admin reset confirm error:", err.response?.data);
      const errText = err.response?.data?.error || "Failed to reset password. Please check the code and try again.";
      setErrorMsg(errText);
      toast.error(errText);
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
              borderRadius: "var(--radius-full, 9999px)",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              fontSize: "0.8rem",
              fontWeight: "700",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            🛡️ Admin Control Panel • Brevo Auth
          </span>
        </div>

        <h2 style={{ textAlign: "center" }}>Reset Staff Password</h2>
        
        <p className="auth-subtitle">
          {step === 1
            ? "Enter your staff administrator email to receive a security verification code via Brevo"
            : `Enter the 6-digit code sent to ${email} and set your new password`}
        </p>

        {errorMsg && <div className="admin-alert error" style={{ marginBottom: "1rem" }}>{errorMsg}</div>}
        {successMsg && (
          <div
            className="alert alert-success"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34d399",
              fontSize: "0.88rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <span>✉️</span>
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Admin Staff Email</label>
              <input
                type="email"
                id="admin_reset_email"
                required
                className="form-control"
                placeholder="admin@shoekave.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-btn"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {loading ? (
                <>
                  <Spinner size={18} />
                  <span>Dispatching Code via Brevo...</span>
                </>
              ) : (
                "Send Reset Code via Brevo"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset} autoComplete="off">
            <div className="form-group">
              <label className="form-label">6-Digit Verification Code</label>
              <input
                type="text"
                id="admin_verification_code"
                required
                maxLength={6}
                className="form-control"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                  letterSpacing: "4px",
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  textAlign: "center"
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Admin Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="new_admin_password"
                  required
                  className="form-control"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                    color: "#94a3b8"
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

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirm_admin_password"
                required
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-btn"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {loading ? (
                <>
                  <Spinner size={18} />
                  <span>Updating Admin Password...</span>
                </>
              ) : (
                "Confirm & Login to Control Panel"
              )}
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => setStep(1)}
              style={{
                width: "100%",
                marginTop: "0.5rem",
                background: "transparent",
                color: "#94a3b8",
                border: "1px solid #334155",
                fontSize: "0.85rem"
              }}
            >
              ← Re-send code / Change email
            </button>
          </form>
        )}

        <div className="auth-switch" style={{ marginTop: "1.5rem" }}>
          Remembered password?{" "}
          <Link to="/admin/login" className="auth-switch-link">
            Back to Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminForgotPassword;
