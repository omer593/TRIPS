const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/auth");
const routeRoutes = require("./routes/routes"); // שם הקובץ הנכון

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 🔍 DEBUG MIDDLEWARE
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.originalUrl}`, req.body);
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/routes", routeRoutes);

// הסר את השורות האלה שגורמות לשגיאה:
// const routeRoutes = require("./routes/routes");
// app.use("/api/routes", routeRoutes);

// בדיקה בסיסית
app.get("/", (req, res) => {
  res.send("🌍 Trip Planner API is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));