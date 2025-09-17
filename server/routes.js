import { createServer } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
import { 
  insertEmployeeSchema, insertPayrollSchema, insertLeaveRequestSchema, 
  insertAttendanceSchema
} from "../shared/mongoose-schema.js";

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

export function createRoutes(app) {
  // Dashboard Stats
  app.get("/api/dashboard/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/employee-stats", requireAuth, async (req, res) => {
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
  app.get("/api/dashboard/activity", requireAdmin, async (_req, res) => {
    res.json([
      { description: 'System initialized', timestamp: new Date().toISOString() },
    ]);
  });

  // Employee routes
  app.get("/api/employees", requireAuth, async (req, res) => {
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

  app.get("/api/employees/:id", requireAuth, async (req, res) => {
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

  app.post("/api/employees", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  app.put("/api/employees/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, validatedData);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Payroll routes
  app.get("/api/payrolls", requireAuth, async (req, res) => {
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

  app.get("/api/payrolls/:id", requireAuth, async (req, res) => {
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

  app.post("/api/payrolls", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertPayrollSchema.parse(req.body);
      const payroll = await storage.createPayroll(validatedData);
      res.status(201).json(payroll);
    } catch (error) {
      res.status(400).json({ message: "Invalid payroll data" });
    }
  });

  app.put("/api/payrolls/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertPayrollSchema.partial().parse(req.body);
      const payroll = await storage.updatePayroll(req.params.id, validatedData);
      res.json(payroll);
    } catch (error) {
      res.status(400).json({ message: "Failed to update payroll" });
    }
  });

  app.delete("/api/payrolls/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePayroll(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payroll" });
    }
  });

  // Leave request routes
  app.get("/api/leave-requests", requireAuth, async (req, res) => {
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

  app.post("/api/leave-requests", requireAuth, async (req, res) => {
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
        employeeId: employee.id || employee._id
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

  app.put("/api/leave-requests/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/leave-requests/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteLeaveRequest(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete leave request" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", requireAuth, async (req, res) => {
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

  app.post("/api/attendance", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Invalid attendance data" });
    }
  });

  app.put("/api/attendance/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.partial().parse(req.body);
      const attendance = await storage.updateAttendance(req.params.id, validatedData);
      res.json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Failed to update attendance" });
    }
  });

  // Employee self-service endpoints used by employee dashboard
  app.get('/api/employee/profile', requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
      res.json(employee);
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });

  app.get('/api/employee/leave-balance', requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
      const stats = await storage.getEmployeeDashboardStats(employee.id);
      res.json({ leaveBalance: stats.leaveBalance });
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch leave balance' });
    }
  });

  app.get('/api/employee/attendance', requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
      const records = await storage.getAttendanceByEmployee(employee.id);
      res.json(records.slice(0, 10));
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch attendance' });
    }
  });

  app.get('/api/employee/payslips', requireAuth, async (req, res) => {
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
  app.get('/api/attendance/today', requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayRecord = await storage.getTodayAttendance(employee.id, today);
      res.json(todayRecord);
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch today attendance' });
    }
  });

  app.post('/api/attendance/checkin', requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if already checked in today
      const existingRecord = await storage.getTodayAttendance(employee.id, today);
      if (existingRecord && existingRecord.checkIn) {
        return res.status(400).json({ message: 'Already checked in today' });
      }
      
      const checkInTime = new Date();
      const attendanceData = {
        employeeId: employee.id,
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
      
      res.json(attendance);
    } catch (e) {
      console.error('Check-in error:', e);
      res.status(500).json({ message: 'Failed to check in' });
    }
  });

  app.post('/api/attendance/checkout', requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingRecord = await storage.getTodayAttendance(employee.id, today);
      if (!existingRecord || !existingRecord.checkIn) {
        return res.status(400).json({ message: 'No check-in record found for today' });
      }
      
      if (existingRecord.checkOut) {
        return res.status(400).json({ message: 'Already checked out today' });
      }
      
      const checkOutTime = new Date();
      const checkInTime = new Date(existingRecord.checkIn);
      const hoursWorked = ((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2);
      
      const attendanceData = {
        checkOut: checkOutTime,
        hoursWorked: hoursWorked
      };
      
      const attendance = await storage.updateAttendance(existingRecord.id, attendanceData);
      res.json(attendance);
    } catch (e) {
      console.error('Check-out error:', e);
      res.status(500).json({ message: 'Failed to check out' });
    }
  });
}