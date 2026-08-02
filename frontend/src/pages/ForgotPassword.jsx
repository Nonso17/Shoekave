import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { Spinner } from "../components/LoadingStates";

function ForgotPassword() {
  const navigate = useNavigate();
  const { saveAuthTokens } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1 = request, 2 = confirm
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await api.post("password-reset/request/", { email });
      setMessage(response.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (!code || !newPassword) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await api.post("password-reset/confirm/", {
        email,
        code,
        new_password: newPassword,
      });

      if (response.data?.tokens && saveAuthTokens) {
        await saveAuthTokens(response.data.tokens);
      }

      setMessage("Password reset successfully! Logging you in...");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password. Please verify the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card">
        <h2>Reset Password</h2>
        <p className="auth-subtitle">
          {step === 1 
            ? "Enter your email to receive a password reset code" 
            : "Enter the code sent to your email and choose a new password"}
        </p>

        {message && <div className="alert alert-success" style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#10b981", fontSize: "0.85rem", marginBottom: "1rem" }}>{message}</div>}
        {error && <div className="alert alert-danger" style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestCode}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-spinner-wrap">
                  <Spinner size={18} />
                  Sending Request...
                </span>
              ) : (
                "Send Reset Code"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset}>
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-spinner-wrap">
                  <Spinner size={18} />
                  Resetting Password...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        <div className="auth-switch">
          <Link to="/login" className="auth-switch-link">
            Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
