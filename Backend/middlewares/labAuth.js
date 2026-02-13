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
    
    // Check if userType is "laboratory"
    if (decoded.userType !== "laboratory") {
      return res.status(403).send({
        error: "Access denied",
        message: "Lab personnel only. You do not have permission to access this resource."
      });
    }
    
    // Attach user data to req.user
    req.user = {
      labId: decoded.labId,
      email: decoded.email,
      userType: decoded.userType
    };
    
    // Also attach labId to req.body for backward compatibility
    req.body.labId = decoded.labId;
    
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
