

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import "./db.js"; // Initialize MongoDB connection first
import { setupAuth } from "./auth.js";
import { createRoutes } from "./routes.js";
import { log } from "./log.js";


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

// Informational log about optional DB skipping
if ((process.env.SKIP_DB || 'false').toLowerCase() === 'true') {
  log('Server started in SKIP_DB mode — MongoDB connection was skipped');
}



if (process.env.NODE_ENV === "development") {
  const { setupVite } = await import("./vite-dev.js");
  await setupVite(app);
} else {
  // dynamic import path normalization to help bundlers
  const { serveStatic } = await import("./static.js");
  serveStatic(app);
}

const PORT = 5000;

// Create HTTP server and Socket.IO
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  log(`Socket.IO: Client connected - ${socket.id}`);
  
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    socket.join(`user_${userId}`);
    log(`User ${userId} joined their room`);
  });

  socket.on('join-project', (projectId) => {
    socket.join(`project_${projectId}`);
    log(`Joined project room: ${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(`project_${projectId}`);
    log(`Left project room: ${projectId}`);
  });
  
  socket.on('disconnect', () => {
    log(`Socket.IO: Client disconnected - ${socket.id}`);
  });
});

// Initialize meeting notifications
import { initializeMeetingNotifications } from './meeting-notifications.js';
initializeMeetingNotifications(io);

// Initialize project notifications
import { initializeProjectNotifications } from './project-notifications.js';
initializeProjectNotifications(io);

// Make io accessible in routes
app.set('io', io);

// API error handler returning JSON (avoid HTML error pages)
app.use('/api', (err, _req, res, _next) => {
  console.error('[api] error', err);
  if (res.headersSent) return;
  res.status(500).json({ message: 'Internal Server Error', detail: process.env.NODE_ENV === 'development' ? String(err) : undefined });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  log(`Express server running on port ${PORT}`);
  log('Socket.IO initialized and ready');
});