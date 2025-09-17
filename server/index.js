/**
 * 🔹 Backend (Node.js + Express) - Main Server File
 * MERN Concepts Used:
 * ✅ Express Server - Creating and configuring Express application
 * ✅ Middleware - JSON parsing, URL encoding, logging, error handling
 * ✅ Routing (CRUD APIs) - Setting up API routes for all endpoints
 * ✅ Authentication (JWT) - Session-based authentication setup
 * ✅ Error Handling Middleware - Global error handler for API endpoints
 * ✅ Validation - Request validation middleware
 * ✅ Route Parameters - Dynamic route handling
 * ✅ Query Parameters - URL parameter processing
 */

import express from "express";
import "./db.js"; // Initialize MongoDB connection first
import { setupAuth } from "./auth.js";
import { createRoutes } from "./routes.js";
import { log } from "./log.js";
import { seedDummyData } from "./seed-data.js";

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

// Seed dummy data after authentication setup
(async () => {
  // Wait a bit for auth setup to complete
  setTimeout(async () => {
    await seedDummyData();
  }, 2000);
})();

if (process.env.NODE_ENV === "development") {
  const { setupVite } = await import("./vite-dev.js");
  await setupVite(app);
} else {
  // dynamic import path normalization to help bundlers
  const { serveStatic } = await import("./static.js");
  serveStatic(app);
}

const PORT = 5000;

// API error handler returning JSON (avoid HTML error pages)
app.use('/api', (err, _req, res, _next) => {
  console.error('[api] error', err);
  if (res.headersSent) return;
  res.status(500).json({ message: 'Internal Server Error', detail: process.env.NODE_ENV === 'development' ? String(err) : undefined });
});
app.listen(PORT, "0.0.0.0", () => {
  log(`Express server running on port ${PORT}`);
});