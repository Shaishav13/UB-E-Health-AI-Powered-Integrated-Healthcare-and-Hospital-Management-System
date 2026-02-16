/*
 * UB E-Health - Doctor or Lab Personnel Authentication Middleware
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  
  // Check if token exists
  if (!token) {
    return res.status(401).send({
      error: "Authentication required",
      message: "Inadequate permissions, Please login first."
    });
  }
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.key);
    
    if (!decoded) {
      return res.status(401).send({
        error: "Invalid token",
        message: "You cannot edit this token."
      });
    }
    
    // Check if userType is "doctor" OR "laboratory"
    if (decoded.userType !== "doctor" && decoded.userType !== "laboratory") {
      return res.status(403).send({
        error: "Access denied",
        message: "Doctor or Lab personnel only. You do not have permission to access this resource."
      });
    }
    
    // Attach user data to req.user based on userType
    if (decoded.userType === "laboratory") {
      req.user = {
        labId: decoded.labId,
        email: decoded.email,
        userType: decoded.userType
      };
      req.body.labId = decoded.labId;
    } else if (decoded.userType === "doctor") {
      req.user = {
        doctorID: decoded.doctorID,
        email: decoded.email,
        userType: decoded.userType
      };
      req.body.doctorID = decoded.doctorID;
    }
    
    next();
  } catch (error) {
    // Handle JWT verification errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send({
        error: "Invalid token",
        message: "Authentication token is invalid."
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).send({
        error: "Token expired",
        message: "Authentication token has expired. Please login again."
      });
    } else {
      return res.status(500).send({
        error: "Authentication error",
        message: "An error occurred during authentication."
      });
    }
  }
};

module.exports = { authenticate };
