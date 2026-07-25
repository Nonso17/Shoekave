import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";


function Signup() {

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { register } = useContext(AuthContext);

  const navigate = useNavigate();



  const onSignup = async () => {

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



      alert("Account created successfully");

      navigate("/login");


    } catch (error) {

  console.log(error.response?.data);

  alert(
    JSON.stringify(error.response?.data)
  );

}

  };



  return (

    <div className="auth-page animate-fade-in">

      <div className="auth-card">

        <h2>Create Account</h2>

        <p className="auth-subtitle">
          Join ShoeKave to track your orders and more
        </p>



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
          className="btn btn-primary auth-btn"
          onClick={onSignup}
        >
          Create Account
        </button>



        <div className="auth-switch">

          Already have an account?{" "}

          <Link 
            to="/login" 
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