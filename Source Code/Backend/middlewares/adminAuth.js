const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send({ 
      error: "Inadequate permissions, Please login first." 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.KEY);
    if (decoded) {
      const adminID = decoded.adminID || decoded.adminId;
      req.body.adminID = adminID;
      next();
    } else {
      return res.status(401).send({ 
        error: "You cannot edit this token." 
      });
    }
  } catch (error) {
    console.error("Admin auth error:", error.message);
    return res.status(401).send({ 
      error: "Invalid or expired token",
      details: error.message
    });
  }
};

module.exports = { authenticate };
