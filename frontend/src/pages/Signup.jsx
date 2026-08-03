import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Spinner } from "../components/LoadingStates";


function Signup() {

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { register, login } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";




  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    if (!fullName.trim() || !email || !password) {
      toast.warn("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const names = fullName.trim().split(" ");
      const first_name = names[0];
      const last_name = names.slice(1).join(" ");

      await register({
        first_name,
        last_name,
        email,
        password
      });

      await login(email, password);
      toast.success("Account created successfully!");
      navigate(from);
    } catch (error) {
      console.log(error.response?.data);
      const errMsg = typeof error.response?.data === "object"
        ? Object.values(error.response.data).flat().join(" ")
        : "Failed to create account. Please try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">
          Join ShoeKave to track your orders and more
        </p>

        <form onSubmit={(e) => { e.preventDefault(); onSignup(); }}>
          <div className="form-group">
            <label className="form-label">
              Full Name
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Email Address
            </label>
            <input
              type="email"
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
            <input
              type="password"
              className="form-control"
              placeholder="Create a password"
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
            {loading ? (
              <span className="btn-spinner-wrap">
                <Spinner size={18} />
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>



        <div className="auth-switch">

          Already have an account?{" "}

          <Link 
            to="/login" 
            state={{ from }}
            className="auth-switch-link"
          >
            Log In
          </Link>

        </div>


      </div>

    </div>

  );

}


export default Signup;