/**
 * 🔹 Backend (Node.js + Express) - Logging Utility
 * MERN Concepts Used:
 * ✅ Express Server - Server-side logging for debugging
 * ✅ Error Handling Middleware - Logging for error tracking
 */

export function log(message, source = 'express') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
