/*
 * UB E-Health - Protected Route Component
 * Copyright (c) 2025 Shaishav
 * Licensed under MIT License - see LICENSE file for details
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * ProtectedRoute component for role-based access control
 * @param {Object} props - Component props
 * @param {React.Component} props.element - The component to render if authorized
 * @param {Array<string>} props.allowedRoles - Array of allowed user types (e.g., ["admin", "laboratory"])
 * @returns {React.Component} - Protected route component
 */
const ProtectedRoute = ({ element, allowedRoles = [] }) => {
  const {
    data: { user, isAuthenticated },
  } = useSelector((state) => state.auth);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // If allowedRoles is specified and user's role is not in the list, redirect to dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.userType)) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and authorized, render the component
  return element;
};

export default ProtectedRoute;
