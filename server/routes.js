import { createServer } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
import { Query } from "../shared/mongoose-schema.js";
import nodemailer from "nodemailer";

import { 
  insertEmployeeSchema, insertPayrollSchema, insertLeaveRequestSchema, 
  insertAttendanceSchema
} from "../shared/mongoose-schema.js";
import express from "express";

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Get all employees
router.get("/api/employees", async (req, res) => {
  const employees = await storage.getAllEmployees();
  res.json(employees);
});

// Get single employee
router.get("/api/employees/:id", async (req, res) => {
  const employee = await storage.getEmployee(req.params.id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.json(employee);
});

// Create employee
router.post("/api/employees", async (req, res) => {
  try {
    const validatedData = insertEmployeeSchema.parse(req.body);
    const employee = await storage.createEmployee(validatedData);
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: "Invalid employee data" });
  }
});

// Update employee
router.put("/api/employees/:id", async (req, res) => {
  try {
    const validatedData = insertEmployeeSchema.partial().parse(req.body);
    const employee = await storage.updateEmployee(req.params.id, validatedData);
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: "Failed to update employee" });
  }
});

// Delete employee
router.delete("/api/employees/:id", async (req, res) => {
  try {
    await storage.deleteEmployee(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete employee" });
  }
});

// Dashboard Stats
router.get("/api/dashboard/stats", requireAdmin, async (req, res) => {
  try {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

router.get("/api/dashboard/employee-stats", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const employee = await storage.getEmployeeByUserId(user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }
    const stats = await storage.getEmployeeDashboardStats(employee.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employee stats" });
  }
});

// Simple recent activity placeholder for admin dashboard
router.get("/api/dashboard/activity", requireAdmin, async (_req, res) => {
  res.json([
    { description: 'System initialized', timestamp: new Date().toISOString() },
  ]);
});

// Employee routes
router.get("/api/employees", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'admin') {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } else {
      const employee = await storage.getEmployeeByUserId(user.id);
      res.json(employee ? [employee] : []);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employees" });
  }
});

router.get("/api/employees/:id", requireAuth, async (req, res) => {
  try {
    const employee = await storage.getEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employee" });
  }
});

router.post("/api/employees", requireAdmin, async (req, res) => {
  try {
    const validatedData = insertEmployeeSchema.parse(req.body);
    const employee = await storage.createEmployee(validatedData);
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: "Invalid employee data" });
  }
});

router.put("/api/employees/:id", requireAdmin, async (req, res) => {
  try {
    const validatedData = insertEmployeeSchema.partial().parse(req.body);
    const employee = await storage.updateEmployee(req.params.id, validatedData);
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: "Failed to update employee" });
  }
});

router.delete("/api/employees/:id", requireAdmin, async (req, res) => {
  try {
    await storage.deleteEmployee(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete employee" });
  }
});

// Payroll routes
router.get("/api/payrolls", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'admin') {
      const payrolls = await storage.getAllPayrolls();
      res.json(payrolls);
    } else {
      const employee = await storage.getEmployeeByUserId(user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }
      const payrolls = await storage.getPayrollsByEmployee(employee.id);
      res.json(payrolls);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payrolls" });
  }
});

router.get("/api/payrolls/:id", requireAuth, async (req, res) => {
  try {
    const payroll = await storage.getPayroll(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: "Payroll not found" });
    }
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payroll" });
  }
});

router.post("/api/payrolls", requireAdmin, async (req, res) => {
  try {
    const validatedData = insertPayrollSchema.parse(req.body);
    const payroll = await storage.createPayroll(validatedData);
    res.status(201).json(payroll);
  } catch (error) {
    res.status(400).json({ message: "Invalid payroll data" });
  }
});

router.put("/api/payrolls/:id", requireAdmin, async (req, res) => {
  try {
    const validatedData = insertPayrollSchema.partial().parse(req.body);
    const payroll = await storage.updatePayroll(req.params.id, validatedData);
    res.json(payroll);
  } catch (error) {
    res.status(400).json({ message: "Failed to update payroll" });
  }
});

router.delete("/api/payrolls/:id", requireAdmin, async (req, res) => {
  try {
    await storage.deletePayroll(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete payroll" });
  }
});

// Leave request routes
router.get("/api/leave-requests", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'admin') {
      const requests = await storage.getAllLeaveRequests();
      res.json(requests);
    } else {
      const employee = await storage.getEmployeeByUserId(user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }
      const requests = await storage.getLeaveRequestsByEmployee(employee.id);
      res.json(requests);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch leave requests" });
  }
});

router.post("/api/leave-requests", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const employee = await storage.getEmployeeByUserId(user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }
    
    console.log('[leave-request] Request body:', req.body);
    console.log('[leave-request] Employee found:', { id: employee.id || employee._id });
    
    const requestData = {
      ...req.body,
      employeeId: (employee.id || employee._id).toString(),
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate)
    };
    
    console.log('[leave-request] Data to validate:', requestData);
    
    const validatedData = insertLeaveRequestSchema.parse(requestData);
    const request = await storage.createLeaveRequest(validatedData);
    res.status(201).json(request);
  } catch (error) {
    console.error('[leave-request] Validation error:', error);
    res.status(400).json({ 
      message: "Invalid leave request data", 
      error: error.message,
      details: error.errors || error
    });
  }
});

router.put("/api/leave-requests/:id", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const updateData = req.body;
    
    if (user.role === 'admin' && (updateData.status === 'approved' || updateData.status === 'rejected')) {
      updateData.approvedBy = user.id;
      updateData.approvedAt = new Date();
    }
    
    const request = await storage.updateLeaveRequest(req.params.id, updateData);
    res.json(request);
  } catch (error) {
    res.status(400).json({ message: "Failed to update leave request" });
  }
});

router.delete("/api/leave-requests/:id", requireAuth, async (req, res) => {
  try {
    await storage.deleteLeaveRequest(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete leave request" });
  }
});

// Attendance routes
router.get("/api/attendance", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'admin') {
      const attendance = await storage.getAllAttendance();
      res.json(attendance);
    } else {
      const employee = await storage.getEmployeeByUserId(user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }
      const attendance = await storage.getAttendanceByEmployee(employee.id);
      res.json(attendance);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
});

router.post("/api/attendance", requireAuth, async (req, res) => {
  try {
    const validatedData = insertAttendanceSchema.parse(req.body);
    const attendance = await storage.createAttendance(validatedData);
    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ message: "Invalid attendance data" });
  }
});

router.put("/api/attendance/:id", requireAuth, async (req, res) => {
  try {
    const validatedData = insertAttendanceSchema.partial().parse(req.body);
    const attendance = await storage.updateAttendance(req.params.id, validatedData);
    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: "Failed to update attendance" });
  }
});

// Employee self-service endpoints used by employee dashboard
router.get('/api/employee/profile', requireAuth, async (req, res) => {
  try {
    const employee = await storage.getEmployeeByUserId(req.user.id);
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    res.json(employee);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.get('/api/employee/leave-balance', requireAuth, async (req, res) => {
  try {
    const employee = await storage.getEmployeeByUserId(req.user.id);
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    const stats = await storage.getEmployeeDashboardStats(employee.id);
    res.json({ leaveBalance: stats.leaveBalance });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch leave balance' });
  }
});

router.get('/api/employee/attendance', requireAuth, async (req, res) => {
  try {
    const employee = await storage.getEmployeeByUserId(req.user.id);
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    const records = await storage.getAttendanceByEmployee(employee.id);
    res.json(records.slice(0, 10));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
});

router.get('/api/employee/payslips', requireAuth, async (req, res) => {
  try {
    const employee = await storage.getEmployeeByUserId(req.user.id);
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    const slips = await storage.getPayrollsByEmployee(employee.id);
    res.json(slips.slice(0, 10));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch payslips' });
  }
});

// Attendance check-in/check-out endpoints
router.get('/api/attendance/today', requireAuth, async (req, res) => {
  try {
    const employee = await storage.getEmployeeByUserId(req.user.id);
    if (!employee) return res.json(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await storage.getTodayAttendance(employee.id || employee._id, today);
    res.json(record || null);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch today's attendance" });
  }
});

router.post('/api/attendance/checkin', requireAuth, async (req, res) => {
  try {
    const employee = await storage.getEmployeeByUserId(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await storage.getTodayAttendance(employee.id || employee._id, today);
    if (existingRecord && existingRecord.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const checkInTime = new Date();
    const attendanceData = {
      employeeId: (employee.id || employee._id).toString(),
      date: today,
      checkIn: checkInTime,
      status: 'present'
    };

    let attendance;
    if (existingRecord) {
      attendance = await storage.updateAttendance(existingRecord.id, attendanceData);
    } else {
      attendance = await storage.createAttendance(attendanceData);
    }

    return res.json(attendance);
  } catch (e) {
    console.error('Check-in error:', e);
    return res.status(500).json({
      message: 'Failed to check in',
      error: e.message || e.toString()
    });
  }
});

router.post('/api/attendance/checkout', requireAuth, async (req, res) => {
  try {
    const employee = await storage.getEmployeeByUserId(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await storage.getTodayAttendance(employee.id || employee._id, today);
    if (!existingRecord || !existingRecord.checkIn) {
      return res.status(400).json({ message: "No check-in record found for today" });
    }

    if (existingRecord.checkOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(existingRecord.checkIn);
    const hoursWorked = ((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2);

    const attendanceData = {
      checkOut: checkOutTime,
      hoursWorked
    };

    const attendance = await storage.updateAttendance(existingRecord.id || existingRecord._id, attendanceData);

    return res.json(attendance);
  } catch (e) {
    console.error("Check-out error:", e);
    return res.status(500).json({ message: "Failed to check out", error: e.message });
  }
});

// Attendance summary for admin
router.get("/api/attendance/summary", requireAdmin, async (req, res) => {
  try {
    const { period } = req.query; // e.g. "2025-09"
    const [year, month] = period.split("-").map(Number);

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    // Fetch all employees
    const employees = await storage.getAllEmployees();

    // Fetch all attendance for the month (including today)
    const attendanceRecords = await storage.getAttendanceInRange(start, end);

    // Get all leaves for the month
    const leaves = await storage.getLeavesInRange(start, end);

    // Get holidays and weekly offs (implement as needed)
    const holidays = await storage.getHolidaysInRange(start, end);

    // Calculate summary for each employee
    const summary = employees.map(emp => {
      const empAttendance = attendanceRecords.filter(a => String(a.employeeId) === String(emp._id));
      const empLeaves = leaves.filter(l => String(l.employeeId) === String(emp._id));
      const empHolidays = holidays.filter(h => h.group === emp.group);

      const totalDays = new Date(year, month, 0).getDate();
      const workingDays = totalDays - empHolidays.length; // Simplified

      let present = 0, leave = 0, travel = 0, earlyGoing = 0, lateComing = 0, overtime = 0, absent = 0;

      empAttendance.forEach(a => {
        if (a.status === "present") present++;
        if (a.status === "travel") travel++;
        if (a.checkIn && new Date(a.checkIn).getHours() >= 9 && new Date(a.checkIn).getMinutes() > 30) lateComing++;
        if (a.checkOut && new Date(a.checkOut).getHours() < 18) earlyGoing++;
        if (a.overtime) overtime += Number(a.overtime);
      });

      leave = empLeaves.length;
      absent = workingDays - present - leave - travel;
      const payable = present + leave + travel + overtime;

      return {
        id: emp.employeeCode || emp._id,
        name: emp.name,
        group: emp.group,
        totalDays,
        workingDays,
        present,
        leave,
        travel,
        holidays: empHolidays.length,
        weeklyOff: 4, // Example, adjust as needed
        earlyGoing,
        lateComing,
        overtime,
        absent,
        payable,
        status: "Locked"
      };
    });

    res.json(summary);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch summary", error: e.message });
  }
});



router.put("/api/profile", requireAuth, async (req, res) => {
  try {
    const employee = await storage.getEmployeeByUserId(req.user.id);
    if (!employee) return res.status(404).json({ message: "Profile not found" });

    const { firstName, lastName, email, phone } = req.body;
    await storage.updateEmployee(employee.id || employee._id, {
      firstName,
      lastName,
      email,
      phone,
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: "Failed to update profile", error: e.message });
  }
});
import bcrypt from "bcrypt"; // make sure you installed bcrypt

router.put("/api/profile/password", requireAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await storage.updateUserPassword(req.user.id, hashedPassword);

    res.json({ success: true, message: "Password reset successful" });
  } catch (e) {
    res.status(500).json({ message: "Failed to reset password", error: e.message });
  }
});

// Add this route anywhere after router is defined:
router.post("/api/query", async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body;
    const query = new Query({ name, email, mobile, message });
    await query.save();
    res.status(201).json({ message: "Query submitted successfully" });
  } catch (err) {
    console.error(err); // Add this for debugging
    res.status(500).json({ error: "Failed to submit query" });
  }
});

// Fetch all queries
router.get("/api/query", async (req, res) => {
  const queries = await Query.find();
  res.json(queries);
});

// Fetch single query by ID
router.get("/api/query/:id", async (req, res) => {
  const query = await Query.findById(req.params.id);
  res.json(query);
});

// Ignore a query
router.patch("/api/query/:id/ignore", async (req, res) => {
  await Query.findByIdAndUpdate(req.params.id, { ignored: true, status: "Ignored" });
  res.json({ message: "Query ignored" });
});

// Answer a query and send email
router.patch("/api/query/:id/answer", async (req, res) => {
  const { answer } = req.body;
  const query = await Query.findByIdAndUpdate(
    req.params.id,
    { answer, status: "Replied", replied: true, ignored: false },
    { new: true }
  );

  // Send email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  const mailOptions = {
    from: '"Loco Payroll" <yourcompanyemail@gmail.com>',
    to: query.email,
    subject: "Your Query Has Been Answered",
    html: `
      <p>Dear ${query.name},</p>
      <p>Thank you for reaching out to us. Here is the response to your query:</p>
      <p><b>Your Query:</b> ${query.message}</p>
      <p><b>Our Answer:</b> ${answer}</p>
      <br/>
      <p>Best regards,<br/>Loco Payroll Team</p>
    `
  };

  await transporter.sendMail(mailOptions);

  res.json({ message: "Answer submitted and email sent" });
});
export function createRoutes(app) {
  app.use(router);
}

export default router;

