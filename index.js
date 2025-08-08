import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import gameResultsRoutes from "./routes/gameResultsRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import creditRoutes from "./routes/creditRoutes.js";
import commission from "./routes/commissionRoutes.js";

import cors from "cors";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Setup dynamic CORS from .env
const allowedOrigins = process.env.CLIENT_ORIGINS?.split(",").map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.includes("localhost")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/game-results", gameResultsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api", creditRoutes);
app.use("/api/commission", commission);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
