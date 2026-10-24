import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    api: "running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/tasks", taskRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid data provided" });
  }
  res.status(500).json({ success: false, message: "Server error. Check the backend terminal." });
});

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Create backend/.env using .env.example.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`FLEXI backend running at http://localhost:${PORT}`));
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }
}

start();
