require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors"); 
const connectMongo = require("./config/db");
const redis = require("./config/redis");

// Routes
const productRoutes = require("./routes/productRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const adminRoutes = require("./routes/adminRoutes");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const app = express();


const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000" } // Your Frontend URL
});

// Make 'io' accessible in your routes
app.set("socketio", io);

io.on("connection", (socket) => {
  console.log("Admin connected to Live Stream: " + socket.id);
});
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ---------- Middlewares ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const purchaseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many purchase attempts" },
});


app.use("/api/admin", adminRoutes);


if (process.env.NODE_ENV !== "test") {
app.use("/api/purchase", purchaseLimiter);
}
// ---------- Routes ----------
app.use("/api/products", productRoutes);
app.use("/api/purchase", purchaseRoutes);

// ---------- Start Server ----------
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Connect DBs after server start
  await connectMongo();
  redis.ping();
});
