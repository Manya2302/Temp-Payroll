/**
 * 🔹 Backend (Node.js + Express) - Database Connection
 * MERN Concepts Used:
 * ✅ Express Server - Database initialization for server
 * ✅ MongoDB Connection - Establishing connection to MongoDB database
 * ✅ Error Handling Middleware - Database connection error handling
 */

import 'dotenv/config';
import { connectMongoDB } from './mongodb.js';
import { log } from './log.js';

// Initialize MongoDB connection
await connectMongoDB();