import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import bcrypt from "bcrypt";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { insertUserSchema } from "../shared/mongoose-schema.js";
import nodemailer from "nodemailer";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePasswords(suppliedPassword, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false;
  
  if (storedHash.startsWith("$2b$") || storedHash.startsWith("$2a$")) {
    return await bcrypt.compare(suppliedPassword, storedHash);
  }
  
  const [hash, salt] = storedHash.split(".");
  if (!hash || !salt) return false;
  const buf = await scryptAsync(suppliedPassword, salt, 64);
  return timingSafeEqual(Buffer.from(hash, "hex"), buf);
}


const otpStore = new Map(); 
const forgotOtpStore = new Map();
const googleOtpStore = new Map(); 

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: `"Loco Payroll" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Loco Payroll Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px;">
        <h2 style="color: #2d3748; margin-bottom: 16px;">Loco Payroll Verification</h2>
        <p>Dear User,</p>
        <p>Thank you for registering with <strong>Loco Payroll</strong>.</p>
        <p>Your One-Time Password (OTP) for account verification is:</p>
        <div style="font-size: 2rem; font-weight: bold; letter-spacing: 4px; color: #2563eb; margin: 16px 0;">
          ${otp}
        </div>
        <p>This code is valid for 5 minutes. <b>Do not share this OTP with anyone.</b> Our team will never ask for your OTP.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="margin: 24px 0;">
        <p style="font-size: 0.9rem; color: #888;">Loco Payroll Team</p>
      </div>
    `,
    text: `Your Loco Payroll OTP is: ${otp}\nThis code is valid for 5 minutes. Do not share it with anyone. Our team will never ask for your OTP.`,
  });
}

async function sendForgotOTPEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: `"Loco Payroll" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Loco Payroll Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px;">
        <h2 style="color: #2d3748; margin-bottom: 16px;">Loco Payroll Password Reset</h2>
        <p>Dear User,</p>
        <p>You requested to reset your password for <strong>Loco Payroll</strong>.</p>
        <p>Your One-Time Password (OTP) for password reset is:</p>
        <div style="font-size: 2rem; font-weight: bold; letter-spacing: 4px; color: #2563eb; margin: 16px 0;">
          ${otp}
        </div>
        <p>This code is valid for 5 minutes. <b>Do not share this OTP with anyone.</b> Our team will never ask for your OTP.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="margin: 24px 0;">
        <p style="font-size: 0.9rem; color: #888;">Loco Payroll Team</p>
      </div>
    `,
    text: `Your Loco Payroll password reset OTP is: ${otp}\nThis code is valid for 5 minutes. Do not share it with anyone. Our team will never ask for your OTP.`,
  });
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

  // Google OAuth Strategy
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  if (googleEnabled) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(null, false, { message: "No email found in Google profile" });
            }

            // Check if user already exists with this Google ID
            const existingUser = await storage.getUserByGoogleId(profile.id);
            if (existingUser) {
              return done(null, existingUser);
            }

            // Return profile data to be handled in the callback route
            return done(null, { googleProfile: profile, email });
          } catch (error) {
            console.error('[auth] Google OAuth error:', error);
            return done(error);
          }
        }
      )
    );
  } else {
    console.warn('[auth] Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  }

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // Check hardcoded credentials first
      if (username === 'admin' && password === 'admin@123') {
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
        let user = await storage.getUserByUsername(username);
        if (!user) {
          user = await storage.createUser({
            username: 'emp',
            password: await hashPassword(password),
            role: 'employee'
          });
          
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
          return done(null, user);
        }
      }
      return done(null, user);
    }),
  );

  passport.serializeUser((user, done) => {
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
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('[auth] Failed to deserialize user:', error);
      done(error);
    }
  });

  // Block direct registration endpoint
  app.post("/api/register", (req, res) => {
    res.status(404).json({ message: "Direct registration is disabled. Please use the OTP registration flow." });
  });

  // Request OTP for registration
  app.post("/api/register/request-otp", async (req, res) => {
    const { username, password, role, email } = req.body;
    if (!username || !password || !role || !email) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 min expiry
      userData: { username, password, role, email }
    });
    try {
      await sendOTPEmail(email, otp);
      res.json({ message: "OTP sent to email" });
    } catch (err) {
      console.error("[auth] Failed to send OTP email:", err);
      res.status(500).json({ message: "Failed to send OTP email" });
    }
  });

  // Verify OTP and create user
  app.post("/api/register/verify-otp", async (req, res, next) => {
    const { email, otp } = req.body;
    const record = otpStore.get(email);
    if (!record || record.otp !== otp || Date.now() > record.expires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    otpStore.delete(email);
    const { username, password, role } = record.userData;
    try {
      const validatedData = insertUserSchema.parse({ username, password, role, email });
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(password),
        email,
      });
      if (user.role === 'employee') {
        // Duplicate email check before creating employee
        const existingEmployee = await storage.getEmployeeByEmail(email);
        if (existingEmployee) {
          console.warn(`[auth] Employee with email ${email} already exists.`);
        } else {
          await storage.createEmployee({
            userId: user.id,
            firstName: username,
            lastName: 'User',
            email,
            department: 'General',
            position: 'Employee',
            salary: '50000',
            hireDate: new Date(),
            status: 'active'
          });
        }
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

  // Resend OTP
  app.post("/api/register/resend-otp", async (req, res) => {
    const { email } = req.body;
    const record = otpStore.get(email);
    if (!record) return res.status(400).json({ message: "No OTP request found for this email" });
    const otp = generateOTP();
    record.otp = otp;
    record.expires = Date.now() + 5 * 60 * 1000;
    otpStore.set(email, record);
    try {
      await sendOTPEmail(email, otp);
      res.json({ message: "OTP resent to email" });
    } catch (err) {
      console.error("[auth] Failed to resend OTP email:", err);
      res.status(500).json({ message: "Failed to resend OTP email" });
    }
  });

  // Forgot Password: Request OTP
  app.post("/api/forgot-password/request-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Email not found" });

    const otp = generateOTP();
    forgotOtpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });
    try {
      await sendForgotOTPEmail(email, otp);
      res.json({ message: "OTP sent to email" });
    } catch (err) {
      console.error("[forgot-password] Failed to send OTP email:", err);
      res.status(500).json({ message: "Failed to send OTP email" });
    }
  });

  // Forgot Password: Verify OTP
  app.post("/api/forgot-password/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    const record = forgotOtpStore.get(email);
    if (!record || record.otp !== otp || Date.now() > record.expires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    res.json({ message: "OTP verified" });
  });

  // Forgot Password: Resend OTP
  app.post("/api/forgot-password/resend-otp", async (req, res) => {
    const { email } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Email not found" });

    const otp = generateOTP();
    forgotOtpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });
    try {
      await sendForgotOTPEmail(email, otp);
      res.json({ message: "OTP resent to email" });
    } catch (err) {
      console.error("[forgot-password] Failed to resend OTP email:", err);
      res.status(500).json({ message: "Failed to resend OTP email" });
    }
  });

  // Forgot Password: Reset Password
  app.post("/api/forgot-password/reset", async (req, res) => {
    const { email, newPassword } = req.body;
    const record = forgotOtpStore.get(email);
    if (!record || Date.now() > record.expires) {
      return res.status(400).json({ message: "OTP expired or not verified" });
    }
    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(400).json({ message: "User not found" });

    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUserPassword(user.id || user._id, hashedPassword);
    forgotOtpStore.delete(email);
    res.json({ message: "Password reset successful" });
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

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('[auth] Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.status(200).json({ message: 'Logout successful' });
    });
  });

  app.get("/api/session", (req, res) => {
    if (req.isAuthenticated()) {
      return res.status(200).json(req.user);
    }
    res.status(401).json({ message: "Unauthorized" });
  });

  // Google OAuth Routes
  if (googleEnabled) {
    app.get("/api/auth/google", 
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { session: false, failureRedirect: "/login" }),
      async (req, res) => {
        try {
          const authData = req.user;
          
          // If user already exists (has googleId), log them in directly
          if (authData.id || authData._id) {
            req.login(authData, (err) => {
              if (err) {
                console.error('[auth] Google login error:', err);
                return res.redirect('/login?error=login_failed');
              }
              // Redirect based on role
              if (authData.role === 'admin') {
                return res.redirect('/admin');
              } else {
                return res.redirect('/employee');
              }
            });
            return;
          }

          // New user - send OTP to their Gmail
          const { email, googleProfile } = authData;
          const otp = generateOTP();
          
          googleOtpStore.set(email, {
            otp,
            expires: Date.now() + 5 * 60 * 1000,
            googleData: {
              googleId: googleProfile.id,
              email,
              displayName: googleProfile.displayName,
              firstName: googleProfile.name?.givenName || '',
              lastName: googleProfile.name?.familyName || '',
              picture: googleProfile.photos?.[0]?.value || ''
            }
          });

          await sendOTPEmail(email, otp);
          
          // Redirect to OTP verification page with email
          res.redirect(`/google-otp-verify?email=${encodeURIComponent(email)}`);
        } catch (error) {
          console.error('[auth] Google callback error:', error);
          res.redirect('/login?error=auth_failed');
        }
      }
    );
  } else {
    // Provide a friendly error response when Google OAuth isn't configured
    app.get('/api/auth/google', (_req, res) => {
      res.status(503).json({ message: 'Google OAuth is not configured on this server. Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET.' });
    });
    app.get('/api/auth/google/callback', (_req, res) => {
      res.status(503).json({ message: 'Google OAuth is not configured on this server. Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET.' });
    });
  }

  // Google OAuth: Verify OTP
  app.post("/api/auth/google/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    const record = googleOtpStore.get(email);
    
    if (!record || record.otp !== otp || Date.now() > record.expires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    
    // OTP verified, now ask for username
    res.json({ 
      message: "OTP verified successfully", 
      email,
      needsUsername: true 
    });
  });

  // Google OAuth: Resend OTP
  app.post("/api/auth/google/resend-otp", async (req, res) => {
    const { email } = req.body;
    const record = googleOtpStore.get(email);
    
    if (!record) {
      return res.status(400).json({ message: "No OTP request found for this email" });
    }
    
    const otp = generateOTP();
    record.otp = otp;
    record.expires = Date.now() + 5 * 60 * 1000;
    googleOtpStore.set(email, record);
    
    try {
      await sendOTPEmail(email, otp);
      res.json({ message: "OTP resent to email" });
    } catch (err) {
      console.error("[auth] Failed to resend Google OTP:", err);
      res.status(500).json({ message: "Failed to resend OTP email" });
    }
  });

  // Google OAuth: Complete Registration with Username
  app.post("/api/auth/google/complete-registration", async (req, res, next) => {
    const { email, username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }
    
    const record = googleOtpStore.get(email);
    if (!record || Date.now() > record.expires) {
      return res.status(400).json({ message: "OTP session expired. Please sign in again." });
    }
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    const { googleData } = record;
    
    try {
      // Create user with Google data
      const user = await storage.createUser({
        username,
        googleId: googleData.googleId,
        email: googleData.email,
        role: 'employee',
        password: null // No password for Google OAuth users
      });
      
      // Create employee record
      const existingEmployee = await storage.getEmployeeByEmail(googleData.email);
      if (!existingEmployee) {
        await storage.createEmployee({
          userId: user.id,
          firstName: googleData.firstName || username,
          lastName: googleData.lastName || 'User',
          email: googleData.email,
          department: 'General',
          position: 'Employee',
          salary: '50000',
          hireDate: new Date(),
          status: 'active'
        });
      }
      
      // Clear the OTP store
      googleOtpStore.delete(email);
      
      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('[auth] Google registration error:', error);
      res.status(400).json({ message: "Registration failed" });
    }
  });
}