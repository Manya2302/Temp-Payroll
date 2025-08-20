import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { insertUserSchema } from "../shared/schema.js";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
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
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

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
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
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
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}