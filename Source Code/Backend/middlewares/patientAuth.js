const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Inadequate permissions, Please login first."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.KEY);
    if (decoded && decoded.patientId) {
      req.body.patientID = decoded.patientId; // Token has patientId, middleware provides patientID
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid token - missing patient ID."
      });
    }
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

module.exports = { authenticate };
