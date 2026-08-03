import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Spinner } from "../components/LoadingStates";


function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";



  useEffect(() => {

    setEmail("");
    setPassword("");

  }, []);






  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      toast.warn("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate(from);
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">
          Log in to your account to continue
        </p>

        <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} autoComplete="off">
          <div className="form-group">
            <label className="form-label">
              Email Address
            </label>
            <input
              type="email"
              name="customer_email"
              id="customer_email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="customer_password"
                id="customer_password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary, #888)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0"
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: "1.5rem", marginTop: "1rem" }}>
            <Link to="/forgot-password" style={{ color: "var(--accent-color, #ef4444)", fontSize: "0.85rem", fontWeight: "600", textDecoration: "none" }}>
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner-wrap">
                <Spinner size={18} />
                Logging in...
              </span>
            ) : (
              "Log In"
            )}
          </button>
        </form>



        <div className="auth-switch">

          Don't have an account?{" "}

          <Link 
            to="/signup" 
            state={{ from }}
            className="auth-switch-link"
          >
            Sign Up
          </Link>

        </div>


      </div>

    </div>
  );
}


export default Login;