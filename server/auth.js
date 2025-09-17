/**
 * 🔹 Backend (Node.js + Express) - Authentication Setup
 * MERN Concepts Used:
 * ✅ Express Server - Authentication middleware setup
 * ✅ Middleware - Session management, passport authentication
 * ✅ Authentication (JWT) - Passport Local Strategy for login/register
 * ✅ Authorization (Role-based) - User roles (admin/employee) handling
 * ✅ Validation - Password hashing and validation
 * ✅ Error Handling Middleware - Authentication error responses
 * ✅ Routing (CRUD APIs) - Auth endpoints (login, register, logout, user)
 */

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { insertUserSchema } from "../shared/mongoose-schema.js";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  // Legacy plaintext support: if no salt delimiter present treat stored as plain
  if (!stored.includes('.')) {
    return supplied === stored;
  }
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "loco-payroll-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      secure: false,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Ensure a default admin exists with known credentials (admin / admin@123)
  (async () => {
    try {
      const existing = await storage.getUserByUsername('admin');
      if (!existing) {
        const adminUser = await storage.createUser({
          username: 'admin',
          password: await hashPassword('admin@123'),
          role: 'admin'
        });
        console.log('[auth] Seeded default admin user');
      }
    } catch (e) {
      console.error('[auth] Failed to seed admin user', e);
    }
  })();

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // Check hardcoded credentials first
      if (username === 'admin' && password === 'admin@123') {
        // Create or get admin user
        let user = await storage.getUserByUsername(username);
        if (!user) {
          user = await storage.createUser({
            username: 'admin',
            password: await hashPassword(password),
            role: 'admin'
          });
        }
        return done(null, user);
      }
      
      if (username === 'emp' && password === 'emp@123') {
        // Create or get employee user
        let user = await storage.getUserByUsername(username);
        if (!user) {
          user = await storage.createUser({
            username: 'emp',
            password: await hashPassword(password),
            role: 'employee'
          });
          
          // Create employee profile if doesn't exist
          const existingEmployee = await storage.getEmployeeByUserId(user.id);
          if (!existingEmployee) {
            await storage.createEmployee({
              userId: user.id,
              firstName: 'John',
              lastName: 'Smith',
              email: 'john.smith@company.com',
              phone: '+1234567890',
              department: 'Engineering',
              position: 'Senior Developer',
              salary: '75000',
              hireDate: new Date('2023-01-15'),
              status: 'active'
            });
          }
        }
        return done(null, user);
      }
      
      // Check database for other users
      const user = await storage.getUserByUsername(username);
      if (!user) return done(null, false);
      const matches = await comparePasswords(password, user.password);
      if (!matches) return done(null, false);
      // Upgrade legacy plaintext password to hashed format
      if (!user.password.includes('.')) {
        try {
          const newHashed = await hashPassword(password);
          const updated = await storage.updateUserPassword(user.id, newHashed);
          return done(null, updated);
        } catch (e) {
          // If upgrade fails still allow login this time
          return done(null, user);
        }
      }
      return done(null, user);
    }),
  );

  passport.serializeUser((user, done) => {
    // Handle both _id and id fields for MongoDB compatibility
    const userId = user._id || user.id;
    if (!userId) {
      console.error('[auth] Failed to serialize user - no ID found:', user);
      return done(new Error('User ID not found'));
    }
    done(null, userId.toString());
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      console.error('[auth] Failed to deserialize user:', error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('[auth] register attempt', req.body?.username, req.body?.role);
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });

      // Create employee profile for non-admin users
      if (user.role === 'employee') {
        await storage.createEmployee({
          userId: user.id,
          firstName: validatedData.username,
          lastName: 'User',
          email: `${validatedData.username}@company.com`,
          department: 'General',
          position: 'Employee',
          salary: '50000',
          hireDate: new Date(),
          status: 'active'
        });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('[auth] register error', error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('[auth] login attempt', req.body?.username);
    passport.authenticate("local", (err, user) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      req.logIn(user, (err2) => {
        if (err2) return next(err2);
        console.log('[auth] login success', user.username, user.role);
        console.log('[auth] session after login', req.session);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('[auth] /api/user session', req.session);
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}