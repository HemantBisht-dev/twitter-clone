import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import { connectMongoDB } from "./db/connectMongoDB.js";

const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// middleware runs before anything executes parse data into json format
app.use(express.json({ limit: "10mb" })); // to parse req.body... limit size for image which is 5 megaByte
// limit size should not be too high to prevent Dos(denial of service)
app.use(express.urlencoded({ extended: true })); //to parse form data
app.use(cookieParser());

app.get("/test", (req, res) => {
  res.send("Backend is working!");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

const environment = process.env.NODE_ENV?.trim(); // Remove any trailing or leading spaces

if (environment === "production") {
  // Serve static files
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  // Catch-all route to serve index.html for SPA
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`server is running port ${PORT}`);
  connectMongoDB();
});
