require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { initSocket } = require("./socket");
const { initializeFirebase } = require("./config/firebase");

const authRoutes = require("./routes/auth");
const managerRoutes = require("./routes/manager");
const ordersRoutes = require("./routes/orders");
const recommendationsRoutes = require("./routes/recommendations");

const app = express();

// Simplified, permissive CORS for frontend usage and preflight handling.
// This ensures responses include Access-Control-Allow-* headers for browsers.
app.use(
  cors({
    origin: true, // reflect request origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);
// Explicitly respond to OPTIONS (preflight)
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,PATCH,DELETE,OPTIONS"
  );
  return res.sendStatus(200);
});

// Fallback header injector in case something strips headers later
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,PATCH,DELETE,OPTIONS"
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "AI Restaurant API is running" });
});

app.get("/api", (req, res) => {
  res.json({ status: "ok", message: "AI Restaurant API is running" });
});

app.use("/auth", authRoutes);
app.use("/manager", managerRoutes);
app.use("/orders", ordersRoutes);
app.use("/ai", recommendationsRoutes);

// serve demo static client pages for quick testing
const path = require("path");
app.use(express.static(path.join(__dirname, "../public")));

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
const io = initSocket(server);

const start = async () => {
  try {
    // Initialize Firebase Firestore
    initializeFirebase();
    console.log("✅ Firebase Firestore initialized successfully");
  } catch (err) {
    console.error("❌ Error initializing Firebase:", err);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Database: Firebase Firestore`);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down server...");
    process.exit(0);
  });
};

// For Vercel serverless deployment
if (process.env.VERCEL) {
  try {
    initializeFirebase();
    console.log("✅ Firebase initialized for Vercel");
  } catch (err) {
    console.error("❌ Firebase initialization failed:", err);
  }
  module.exports = app;
} else {
  start();
}
