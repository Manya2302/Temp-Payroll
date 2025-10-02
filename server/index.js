import express from "express";
import "./db.js"; // Initialize MongoDB connection first
import { setupAuth } from "./auth.js";
import { createRoutes } from "./routes.js";
import { log } from "./log.js";
import employeeLeaveRoutes from "./routes.js";
import cron from "node-cron";
import { storage } from "./storage.js";
import router from "./routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic API request logger (method + path) to help debug route matching
app.use('/api', (req, _res, next) => {
  console.log(`[api] ${req.method} ${req.path}`);
  next();
});

setupAuth(app);
createRoutes(app);
app.use(employeeLeaveRoutes);

if (process.env.NODE_ENV === "development") {
  const { setupVite } = await import("./vite-dev.js");
  await setupVite(app);
} else {
  // dynamic import path normalization to help bundlers
  const { serveStatic } = await import("./static.js");
  serveStatic(app);
}

const PORT = 5001;

// API error handler returning JSON (avoid HTML error pages)
app.use('/api', (err, _req, res, _next) => {
  console.error('[api] error', err);
  if (res.headersSent) return;
  res.status(500).json({ message: 'Internal Server Error', detail: process.env.NODE_ENV === 'development' ? String(err) : undefined });
});

// Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("[Auto Checkout] Running midnight job...");

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all attendance records for yesterday without checkout
    const records = await storage.getUnclosedAttendance(yesterday, today);

    for (const record of records) {
      const checkOutTime = new Date(today); // midnight
      const checkInTime = new Date(record.checkIn);
      const hoursWorked = ((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2);

      await storage.updateAttendance(record.id || record._id, {
        checkOut: checkOutTime,
        hoursWorked,
      });

      console.log(`[Auto Checkout] Closed record for employee ${record.employeeId}`);
    }
  } catch (err) {
    console.error("[Auto Checkout] Error:", err);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  log(`Express server running on port ${PORT}`);
});