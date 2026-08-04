import React, { useContext } from "react";
import { Navigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";


function ProtectedRoute({ children, adminOnly = false }) {

  const { user, loading } = useContext(AuthContext);


  if (loading) {

    return (
      <div className="loading-screen">
        Loading...
      </div>
    );

  }


  if (!user) {
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} state={{ from: window.location.pathname }} replace />;
  }

  if (adminOnly && !user.is_staff) {
    return <Navigate to="/" replace />;
  }


  return children;

}


export default ProtectedRoute;