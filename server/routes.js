import { createServer } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
import { 
  insertEmployeeSchema, insertPayrollSchema, insertLeaveRequestSchema, 
  insertAttendanceSchema
} from "../shared/schema.js";

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
      
      const validatedData = insertLeaveRequestSchema.parse({
        ...req.body,
        employeeId: employee.id
      });
      const request = await storage.createLeaveRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid leave request data" });
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
}