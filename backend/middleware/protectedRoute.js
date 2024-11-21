import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Middleware to protect routes by verifying the user's authentication token
export const protectRoute = async (req, res, next) => {
  try {
    // Extract the JWT token from the cookies
    const token = req.cookies.jwt;

    // If no token is found, the user is unauthorized
    if (!token) {
      return res.status(401).json({ error: "unauthorized no token provided" });
    }

    // Verify the token using the secret key from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If the token is invalid or decoding fails, return an unauthorized error
    if (!decoded) {
      return res.status(401).json({ error: "unauthorized invalid token" });
    }

    // Retrieve the user from the database using the userId from the decoded token
    // Use .select("-password") to exclude the password field from the user data
    const user = await User.findById(decoded.userId).select("-password");

    // If no user is found in the database, return a "user not found" error
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    // Attach the user object to the request object for use in subsequent middleware or routes
    req.user = user;

    // Call the next middleware or route handler
    next();
  } catch (error) {
    console.log("Error in protectedRoute middleware", error.message);
    res.status(500).json({ error: "Internal server Error" });
  }
};
