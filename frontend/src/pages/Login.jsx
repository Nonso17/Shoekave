import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useContext(AuthContext);

  const navigate = useNavigate();



  useEffect(() => {

    setEmail("");
    setPassword("");

  }, []);




  const onLogin = async () => {

    try {

      await login(email, password);

      navigate("/");

    } catch (error) {

      console.log(error);

      alert("Login failed");

    }

  };



  return (
    <div className="auth-page animate-fade-in">

      <div className="auth-card">

        <h2>Welcome Back</h2>

        <p className="auth-subtitle">
          Log in to your account to continue
        </p>



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
            placeholder="Enter your password"
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
          />

        </div>



        <button
          className="btn btn-primary auth-btn"
          onClick={onLogin}
        >
          Log In
        </button>



        <div className="auth-switch">

          Don't have an account?{" "}

          <Link 
            to="/signup" 
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