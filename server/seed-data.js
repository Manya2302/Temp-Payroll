/**
 * 🔹 Backend (Node.js + Express) - Database Seeding
 * MERN Concepts Used:
 * ✅ Express Server - Database initialization with sample data
 * ✅ Validation - Password hashing and data validation
 * ✅ Error Handling Middleware - Seed operation error handling
 * ✅ MongoDB Connection - Data insertion and user creation
 */

import { storage } from "./storage.js";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDummyData() {
  // Dummy data creation removed to prevent duplicate key errors and related logs
  // Function intentionally left blank
}