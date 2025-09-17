/**
 * 🔹 Backend (Node.js + Express) - Storage Layer Setup
 * MERN Concepts Used:
 * ✅ Express Server - Database storage layer configuration
 * ✅ MongoDB Connection - Storage abstraction for MongoDB operations
 */

import { DatabaseStorage as MongoDBStorage } from "./mongodb-storage.js";

// Export the new MongoDB storage as the default storage
export { MongoDBStorage as DatabaseStorage };

export const storage = new MongoDBStorage();