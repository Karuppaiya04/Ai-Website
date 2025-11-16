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

// Configure CORS to allow requests from your frontend and handle preflight
// Use environment variable ALLOWED_ORIGINS (comma-separated) or allow all with '*'
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., server-to-server or tools without origin)
    if (!origin) return callback(null, true);
    const allowed = (process.env.ALLOWED_ORIGINS || '*')
      .split(',')
      .map((s) => s.trim());
    if (allowed.includes('*') || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
// Ensure preflight requests are handled
app.options('*', cors(corsOptions));

// Add explicit headers as a fallback for any intermediate proxy
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
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
