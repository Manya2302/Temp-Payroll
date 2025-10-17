import { createServer } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
import express from 'express';
import {
  insertEmployeeSchema, insertPayrollSchema, insertLeaveRequestSchema,
  insertAttendanceSchema, Profile, insertProfileSchema, Query, insertLoanSchema,
  Calendar
} from "../shared/mongoose-schema.js";
import nodemailer from "nodemailer";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal.js";
import PDFDocument from "pdfkit";

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

export function createRoutes(app) {

  /*** USER AUTHENTICATION ROUTES ***/
  // Get current authenticated user
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  /*** ADMIN FIX ROUTES ***/
  app.post("/api/admin/fix-user-ids", requireAdmin, async (req, res) => {
    try {
      const mongoose = await import('mongoose');
      const { User, Employee } = await import('../shared/mongoose-schema.js');
      const Project = (await import('./models/Project.js')).default;
      
      console.log('=== Starting User ID Fix Process ===\n');
      
      // Get all users
      const users = await User.find({}).lean();
      console.log('Found users in User collection:');
      users.forEach(user => {
        console.log(`  ${user.username}: _id = ${user._id.toString()}`);
      });
      
      // Get all employees with their user references
      const employees = await Employee.find({}).populate('userId').lean();
      console.log('\nFound employees in Employee collection:');
      const employeeMap = {};
      
      for (const emp of employees) {
        if (emp.userId) {
          const fullName = `${emp.firstName} ${emp.lastName}`;
          console.log(`  ${fullName}: userId = ${emp.userId._id.toString()}, username = ${emp.userId.username}`);
          employeeMap[fullName] = emp.userId._id.toString();
          employeeMap[fullName.toLowerCase()] = emp.userId._id.toString();
          // Also map by first name only for partial matches
          employeeMap[emp.firstName] = emp.userId._id.toString();
          employeeMap[emp.firstName.toLowerCase()] = emp.userId._id.toString();
        }
      }
      
      console.log('\n=== Checking Projects for User ID Mismatches ===\n');
      
      // Get all projects
      const projects = await Project.find({}).lean();
      
      let fixCount = 0;
      let projectsFixed = 0;
      const fixes = [];
      
      for (const project of projects) {
        let projectUpdated = false;
        
        // Check assignedEmployees
        for (let i = 0; i < project.assignedEmployees.length; i++) {
          const emp = project.assignedEmployees[i];
          const correctId = employeeMap[emp.name] || employeeMap[emp.name.toLowerCase()];
          
          if (correctId && emp.userId.toString() !== correctId) {
            console.log(`Project "${project.projectTitle}": Fixing ${emp.name}'s userId in assignedEmployees`);
            console.log(`  Old: ${emp.userId.toString()}`);
            console.log(`  New: ${correctId}`);
            
            await Project.updateOne(
              { _id: project._id, 'assignedEmployees._id': emp._id },
              { $set: { 'assignedEmployees.$.userId': new mongoose.default.Types.ObjectId(correctId) } }
            );
            
            fixes.push({
              project: project.projectTitle,
              employee: emp.name,
              oldUserId: emp.userId.toString(),
              newUserId: correctId,
              location: 'assignedEmployees'
            });
            
            projectUpdated = true;
            fixCount++;
          }
        }
        
        // Check days assignees
        for (let dayIdx = 0; dayIdx < project.days.length; dayIdx++) {
          const day = project.days[dayIdx];
          
          for (let assigneeIdx = 0; assigneeIdx < day.assignees.length; assigneeIdx++) {
            const assignee = day.assignees[assigneeIdx];
            const correctId = employeeMap[assignee.name] || employeeMap[assignee.name.toLowerCase()];
            
            if (correctId && assignee.userId.toString() !== correctId) {
              console.log(`Project "${project.projectTitle}" Day ${day.dayNumber}: Fixing ${assignee.name}'s userId`);
              console.log(`  Old: ${assignee.userId.toString()}`);
              console.log(`  New: ${correctId}`);
              
              await Project.updateOne(
                { _id: project._id },
                { $set: { [`days.${dayIdx}.assignees.${assigneeIdx}.userId`]: new mongoose.default.Types.ObjectId(correctId) } }
              );
              
              fixes.push({
                project: project.projectTitle,
                day: day.dayNumber,
                employee: assignee.name,
                oldUserId: assignee.userId.toString(),
                newUserId: correctId,
                location: `day ${day.dayNumber} assignees`
              });
              
              projectUpdated = true;
              fixCount++;
            }
          }
        }
        
        if (projectUpdated) {
          projectsFixed++;
          console.log(`✓ Updated project "${project.projectTitle}"\n`);
        }
      }
      
      console.log('\n=== Fix Summary ===');
      console.log(`Total userId fixes applied: ${fixCount}`);
      console.log(`Total projects updated: ${projectsFixed}`);
      
      res.json({
        success: true,
        message: 'User ID fix completed',
        fixCount,
        projectsFixed,
        fixes
      });
      
    } catch (error) {
      console.error('Fix user IDs error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fix user IDs',
        error: error.message 
      });
    }
  });

  /*** DASHBOARD ROUTES ***/
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
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: "Employee profile not found" });
      const stats = await storage.getEmployeeDashboardStats(employee.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee stats" });
    }
  });

  /*** EMPLOYEE ROUTES ***/
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
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", requireAdmin, async (req, res) => {
    try {
      const data = { ...req.body };

      // Convert hireDate string to Date
      if (data.hireDate) data.hireDate = new Date(data.hireDate);
      if (data.salary !== undefined) data.salary = Number(data.salary);

      const validatedData = insertEmployeeSchema.parse(data);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Create employee error:", error);
      res.status(400).json({ message: "Invalid employee data", error: error.message });
    }
  });

  app.put("/api/employees/:id", requireAdmin, async (req, res) => {
    try {
      const data = { ...req.body };

      console.log('[routes] PUT /api/employees/:id payload:', JSON.stringify(data));

      // Convert hireDate string to Date if exists
      if (data.hireDate) {
        const parsedDate = new Date(data.hireDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: "Invalid hireDate format" });
        }
        data.hireDate = parsedDate;
      }

      // Convert salary to number if exists
      if (data.salary !== undefined) data.salary = Number(data.salary);

      // Validate
      const validatedData = insertEmployeeSchema.partial().parse(data);

  const employee = await storage.updateEmployee(req.params.id, validatedData);
  console.log('[routes] PUT /api/employees/:id updated employee:', employee);
      if (!employee) return res.status(404).json({ message: "Employee not found" });

      res.json(employee);
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(400).json({ message: "Failed to update employee", error: error.message });
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

  /*** PAYROLL ROUTES ***/
  app.get("/api/payrolls", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      if (user.role === 'admin') {
        const payrolls = await storage.getAllPayrolls();
        res.json(payrolls);
      } else {
        const employee = await storage.getEmployeeByUserId(user.id);
        const payrolls = await storage.getPayrollsByEmployee(employee.id);
        res.json(payrolls);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payrolls" });
    }
  });

  app.post("/api/payrolls", requireAdmin, async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.amount) data.amount = Number(data.amount);
      const validatedData = insertPayrollSchema.parse(data);
      const payroll = await storage.createPayroll(validatedData);
      res.status(201).json(payroll);
    } catch (error) {
      res.status(400).json({ message: "Invalid payroll data" });
    }
  });

  app.put("/api/payrolls/:id", requireAdmin, async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.amount) data.amount = Number(data.amount);
      const validatedData = insertPayrollSchema.partial().parse(data);
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

  /*** LEAVE REQUEST ROUTES ***/
  app.get("/api/leave-requests", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      if (user.role === 'admin') {
        const requests = await storage.getAllLeaveRequests();
        res.json(requests);
      } else {
        const employee = await storage.getEmployeeByUserId(user.id);
        const requests = await storage.getLeaveRequestsByEmployee(employee.id);
        res.json(requests);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave requests" });
    }
  });

  app.post("/api/leave-requests", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: "Employee profile not found" });

      const requestData = {
        ...req.body,
        employeeId: (employee.id || employee._id).toString(),
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      };

      const validatedData = insertLeaveRequestSchema.parse(requestData);
      const request = await storage.createLeaveRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid leave request data", error: error.message });
    }
  });

  app.patch("/api/leave-requests/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const leave = await storage.getLeaveRequest(req.params.id);
      if (!leave) return res.status(404).json({ message: "Leave request not found" });

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      leave.status = status;
      leave.approvedBy = req.user.id;
      leave.approvedAt = new Date();
      await storage.updateLeaveRequest(req.params.id, leave);

      res.json({ message: `Leave request ${status}` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update leave request status" });
    }
  });

  app.put("/api/leave-requests/:id", requireAuth, async (req, res) => {
    try {
      const updateData = req.body;
      const leave = await storage.updateLeaveRequest(req.params.id, updateData);
      res.json(leave);
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

  /*** ATTENDANCE ROUTES ***/
  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      if (user.role === 'admin') {
        const records = await storage.getAllAttendance();
        res.json(records);
      } else {
        const employee = await storage.getEmployeeByUserId(user.id);
        const records = await storage.getAttendanceByEmployee(employee.id);
        res.json(records);
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
  // Attendance check-in endpoint
  app.post('/api/attendance/checkin', requireAuth, async (req, res) => {
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
        attendance = await storage.updateAttendance(existingRecord.id || existingRecord._id, attendanceData);
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

  // Attendance check-out endpoint
  app.post('/api/attendance/checkout', requireAuth, async (req, res) => {
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

  // Attendance today endpoint
  app.get('/api/attendance/today', requireAuth, async (req, res) => {
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

  // Attendance summary endpoint with calculations
  app.get('/api/attendance/summary', requireAdmin, async (req, res) => {
    try {
      const { month, year } = req.query;
      const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      
      // Validate that requested period is not in the future
      const requestedDate = new Date(targetYear, targetMonth, 1);
      const today = new Date();
      const currentDateForComparison = new Date();
      currentDateForComparison.setDate(1);
      currentDateForComparison.setHours(0, 0, 0, 0);
      
      if (requestedDate > currentDateForComparison) {
        return res.status(400).json({ 
          message: 'Cannot retrieve attendance for future months',
          error: 'Invalid period selected'
        });
      }
      
      const startDate = new Date(targetYear, targetMonth, 1);
      const isCurrentMonth = targetMonth === today.getMonth() && targetYear === today.getFullYear();
      const endDate = isCurrentMonth ? today : new Date(targetYear, targetMonth + 1, 0);
      
      const totalDaysInPeriod = isCurrentMonth ? today.getDate() : endDate.getDate();
      
      const employees = await storage.getAllEmployees();
      const summaryData = [];
      
      for (const emp of employees) {
        const employeeId = emp.id || emp._id;
        
        const attendanceRecords = await storage.getAttendanceByEmployee(
          employeeId,
          startDate,
          endDate
        );
        
        const leaveRequests = await storage.getLeaveRequestsByEmployee(employeeId);
        const approvedLeaves = leaveRequests.filter(leave => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          return leave.status === 'approved' && 
                 ((leaveStart >= startDate && leaveStart <= endDate) ||
                  (leaveEnd >= startDate && leaveEnd <= endDate));
        });
        
        let leaveDays = 0;
        approvedLeaves.forEach(leave => {
          const leaveStart = new Date(Math.max(leave.startDate, startDate));
          const leaveEnd = new Date(Math.min(leave.endDate, endDate));
          const days = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;
          leaveDays += days;
        });
        
        let presentDays = 0;
        let earlyGoingDays = 0;
        let lateComingDays = 0;
        let overtimeHours = 0;
        
        const attendanceDates = new Set();
        attendanceRecords.forEach(record => {
          const recordDate = new Date(record.date);
          attendanceDates.add(recordDate.toDateString());
          
          if (record.status === 'present' || record.status === 'late') {
            presentDays++;
          }
          
          if (record.checkIn) {
            const checkInTime = new Date(record.checkIn);
            const checkInHour = checkInTime.getHours();
            const checkInMinute = checkInTime.getMinutes();
            
            if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30)) {
              lateComingDays++;
            }
          }
          
          if (record.checkOut) {
            const checkOutTime = new Date(record.checkOut);
            const checkOutHour = checkOutTime.getHours();
            const checkOutMinute = checkOutTime.getMinutes();
            
            const totalMinutes = checkOutHour * 60 + checkOutMinute;
            const targetMinutes = 17 * 60 + 30;
            
            if (totalMinutes < targetMinutes) {
              earlyGoingDays++;
            } else if (totalMinutes > targetMinutes) {
              const extraMinutes = totalMinutes - targetMinutes;
              overtimeHours += extraMinutes / 60;
            }
          }
        });
        
        let weeklyOffDays = 0;
        let holidays = 0;
        for (let day = 1; day <= totalDaysInPeriod; day++) {
          const checkDate = new Date(targetYear, targetMonth, day);
          const dayOfWeek = checkDate.getDay();
          
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            weeklyOffDays++;
            holidays++;
          }
        }
        
        const workingDays = attendanceRecords.length;
        const nonWorkingDays = totalDaysInPeriod - workingDays;
        const absentDays = totalDaysInPeriod - presentDays - leaveDays - weeklyOffDays;
        const payableDays = presentDays + leaveDays;
        
        summaryData.push({
          id: employeeId.toString(),
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          totalDays: totalDaysInPeriod,
          workingDays: workingDays,
          nonWorkingDays: nonWorkingDays,
          presentDays: presentDays,
          leaveDays: leaveDays,
          travelDays: 0,
          holidays: holidays,
          weeklyOffDays: weeklyOffDays,
          earlyGoingDays: earlyGoingDays,
          lateComingDays: lateComingDays,
          overtimeHours: Math.round(overtimeHours * 10) / 10,
          absentDays: Math.max(0, absentDays),
          payableDays: payableDays,
          status: 'Active'
        });
      }
      
      res.json(summaryData);
    } catch (error) {
      console.error('Error calculating attendance summary:', error);
      res.status(500).json({ message: 'Failed to calculate attendance summary', error: error.message });
    }
  });

  /*** PROFILE ROUTES ***/
  // Get profile for logged-in user
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: "Employee profile not found" });

      const profile = await Profile.findOne({ employeeId: employee._id.toString() });
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
  });

  // Create profile (always sets employeeId to logged-in employee)
  app.post("/api/profile", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: "Employee profile not found" });

      const data = { ...req.body, employeeId: employee._id.toString() };
      const validatedData = insertProfileSchema.parse(data);

      // Prevent duplicate profile for same employeeId
      const existing = await Profile.findOne({ employeeId: validatedData.employeeId });
      if (existing) {
        return res.status(400).json({ message: "Profile already exists for this employeeId" });
      }

      const profile = new Profile(validatedData);
      await profile.save();
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ message: "Invalid profile data", error: error.message });
    }
  });

  // Update profile
  app.put("/api/profile/:employeeId", requireAuth, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const data = { ...req.body };
      const validatedData = insertProfileSchema.partial().parse(data);
      

      const profile = await Profile.findOneAndUpdate(
        { employeeId },
        validatedData,
        { new: true }
      );
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Failed to update profile", error: error.message });
    }
  });

  // Delete profile
  app.delete("/api/profile/:employeeId", requireAdmin, async (req, res) => {
    try {
      const { employeeId } = req.params;
      await Profile.findOneAndDelete({ employeeId });
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete profile" });
    }
  });

  // TEMPORARY: Fix profile.employeeId to match Employee _id for all employees
  app.post("/api/admin/fix-profile-employeeid", requireAdmin, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      let updated = 0;
      for (const employee of employees) {
        // Find profile by email (or another unique field)
        let profile = await Profile.findOne({ email: employee.email });
        if (profile) {
          if (profile.employeeId !== employee._id.toString()) {
            profile.employeeId = employee._id.toString();
            await profile.save();
            updated++;
          }
        } else {
          // Optionally, create a profile if missing (using employee data)
          // Uncomment below if you want to auto-create missing profiles:
          /*
          const newProfile = new Profile({
            employeeId: employee._id.toString(),
            firstName: employee.firstName || "",
            lastName: employee.lastName || "",
            email: employee.email || "",
            // ...set other fields as needed, or leave blank...
          });
          await newProfile.save();
          updated++;
          */
        }
      }
      res.json({ message: `Updated ${updated} profiles.` });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profiles", error: error.message });
    }
  });

  // Contact/Query routes

  // Submit a query
  app.post("/api/query", async (req, res) => {
    try {
      const { name, email, mobile, message } = req.body;
      const query = new Query({ name, email, mobile, message });
      await query.save();
      res.status(201).json({ message: "Query submitted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit query" });
    }
  });

  // Fetch all queries
  app.get("/api/query", async (req, res) => {
    try {
      const queries = await Query.find();
      res.json(queries);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch queries" });
    }
  });

  // Fetch single query by ID
  app.get("/api/query/:id", async (req, res) => {
    try {
      const query = await Query.findById(req.params.id);
      res.json(query);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch query" });
    }
  });

  // Ignore a query
  app.patch("/api/query/:id/ignore", async (req, res) => {
    try {
      await Query.findByIdAndUpdate(req.params.id, { ignored: true, status: "Ignored" });
      res.json({ message: "Query ignored" });
    } catch (err) {
      res.status(500).json({ error: "Failed to ignore query" });
    }
  });

  // Answer a query and send email
  app.patch("/api/query/:id/answer", async (req, res) => {
    try {
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
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to answer query and send email" });
    }
  });

  /*** LOAN ROUTES ***/
  app.get("/api/loans", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      if (user.role === 'admin') {
        const loans = await storage.getAllLoans();
        res.json(loans);
      } else {
        const employee = await storage.getEmployeeByUserId(user.id);
        if (!employee) return res.status(404).json({ message: "Employee profile not found" });
        const loans = await storage.getLoansByEmployee(employee._id || employee.id);
        res.json(loans);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.get("/api/loans/pending", requireAdmin, async (req, res) => {
    try {
      const loans = await storage.getPendingLoans();
      res.json(loans);
    } catch (error) {
      console.error('Error fetching pending loans:', error);
      res.status(500).json({ message: "Failed to fetch pending loans" });
    }
  });

  app.get("/api/loans/approved", requireAdmin, async (req, res) => {
    try {
      const loans = await storage.getApprovedLoans();
      res.json(loans);
    } catch (error) {
      console.error('Error fetching approved loans:', error);
      res.status(500).json({ message: "Failed to fetch approved loans" });
    }
  });

  app.post("/api/loans", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: "Employee profile not found" });

      const loanData = {
        employeeId: (employee._id || employee.id).toString(),
        loanAmount: Number(req.body.loanAmount),
        repaymentPeriod: Number(req.body.repaymentPeriod),
        reason: req.body.reason,
        monthlyEmi: Number(req.body.loanAmount) / Number(req.body.repaymentPeriod),
        pendingAmount: Number(req.body.loanAmount),
        status: 'pending'
      };

      const validatedData = insertLoanSchema.parse(loanData);
      const loan = await storage.createLoan({
        ...validatedData,
        monthlyEmi: loanData.monthlyEmi,
        pendingAmount: loanData.pendingAmount,
        status: loanData.status
      });
      
      res.status(201).json(loan);
    } catch (error) {
      console.error('Error creating loan:', error);
      res.status(400).json({ message: "Invalid loan data", error: error.message });
    }
  });

  app.patch("/api/loans/:id/approve", requireAdmin, async (req, res) => {
    try {
      const loan = await storage.getLoan(req.params.id);
      if (!loan) return res.status(404).json({ message: "Loan not found" });

      if (loan.status !== 'pending') {
        return res.status(400).json({ message: "Only pending loans can be approved" });
      }

      const approvedDate = new Date();
      const nextDueDate = new Date();
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      const updatedLoan = await storage.updateLoan(req.params.id, {
        status: 'approved',
        approvedDate,
        nextDueDate,
        remarks: req.body.remarks || ''
      });

      res.json(updatedLoan);
    } catch (error) {
      console.error('Error approving loan:', error);
      res.status(500).json({ message: "Failed to approve loan" });
    }
  });

  app.patch("/api/loans/:id/reject", requireAdmin, async (req, res) => {
    try {
      const loan = await storage.getLoan(req.params.id);
      if (!loan) return res.status(404).json({ message: "Loan not found" });

      if (loan.status !== 'pending') {
        return res.status(400).json({ message: "Only pending loans can be rejected" });
      }

      const updatedLoan = await storage.updateLoan(req.params.id, {
        status: 'rejected',
        remarks: req.body.remarks || 'Loan request rejected'
      });

      res.json(updatedLoan);
    } catch (error) {
      console.error('Error rejecting loan:', error);
      res.status(500).json({ message: "Failed to reject loan" });
    }
  });

  /*** PAYPAL ROUTES ***/
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/loans/:id/paypal-order", requireAuth, async (req, res) => {
    try {
      const loan = await storage.getLoan(req.params.id);
      if (!loan) return res.status(404).json({ message: "Loan not found" });

      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee || (loan.employeeId._id || loan.employeeId).toString() !== (employee._id || employee.id).toString()) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (loan.status !== 'approved') {
        return res.status(400).json({ message: "Can only pay for approved loans" });
      }

      if (loan.pendingAmount <= 0) {
        return res.status(400).json({ message: "No pending amount for this loan" });
      }

      const orderPayload = {
        body: {
          amount: loan.monthlyEmi.toFixed(2),
          currency: 'USD',
          intent: 'CAPTURE'
        }
      };

      await createPaypalOrder({ body: orderPayload.body }, res);
    } catch (error) {
      console.error('Error creating PayPal order for loan:', error);
      res.status(500).json({ message: "Failed to create payment order" });
    }
  });

  app.post("/api/loans/:id/paypal-capture/:orderID", requireAuth, async (req, res) => {
    try {
      const loan = await storage.getLoan(req.params.id);
      if (!loan) return res.status(404).json({ message: "Loan not found" });

      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee || (loan.employeeId._id || loan.employeeId).toString() !== (employee._id || employee.id).toString()) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (loan.status !== 'approved') {
        return res.status(400).json({ message: "Can only pay for approved loans" });
      }

      const captureReq = {
        params: { orderID: req.params.orderID }
      };

      const captureRes = {
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: async function(data) {
          if (this.statusCode === 200 || this.statusCode === 201) {
            const newPendingAmount = Math.max(0, loan.pendingAmount - loan.monthlyEmi);
            const nextDueDate = newPendingAmount > 0 ? new Date(loan.nextDueDate || new Date()) : null;
            if (nextDueDate) {
              nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            }

            const updatedLoan = await storage.updateLoan(req.params.id, {
              pendingAmount: newPendingAmount,
              nextDueDate: nextDueDate
            });

            const emiData = {
              employeeId: (employee._id || employee.id).toString(),
              loanId: (loan._id || loan.id).toString(),
              amount: loan.monthlyEmi,
              paymentMethod: 'paypal',
              transactionId: data.id || req.params.orderID,
              paypalOrderId: req.params.orderID,
              status: 'completed'
            };

            const emi = await storage.createEMI(emiData);

            res.json({ success: true, loan: updatedLoan, emi, paypalData: data });
          } else {
            res.status(this.statusCode).json(data);
          }
        }
      };

      await capturePaypalOrder(captureReq, captureRes);
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      res.status(500).json({ message: "Failed to capture payment" });
    }
  });

  /*** EMI ROUTES ***/
  app.get("/api/emis", requireAdmin, async (req, res) => {
    try {
      const emis = await storage.getAllEMIs();
      res.json(emis);
    } catch (error) {
      console.error('Error fetching EMIs:', error);
      res.status(500).json({ message: "Failed to fetch EMI records" });
    }
  });

  app.get("/api/emis/loan/:loanId", requireAuth, async (req, res) => {
    try {
      const loan = await storage.getLoan(req.params.loanId);
      if (!loan) return res.status(404).json({ message: "Loan not found" });

      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (req.user.role !== 'admin' && (!employee || (loan.employeeId._id || loan.employeeId).toString() !== (employee._id || employee.id).toString())) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const emis = await storage.getEMIsByLoan(req.params.loanId);
      res.json(emis);
    } catch (error) {
      console.error('Error fetching loan EMIs:', error);
      res.status(500).json({ message: "Failed to fetch EMI records" });
    }
  });

  app.get("/api/emis/employee", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) return res.status(404).json({ message: "Employee profile not found" });

      const emis = await storage.getEMIsByEmployee(employee._id || employee.id);
      res.json(emis);
    } catch (error) {
      console.error('Error fetching employee EMIs:', error);
      res.status(500).json({ message: "Failed to fetch EMI records" });
    }
  });

  app.get("/api/emis/:id/invoice", requireAuth, async (req, res) => {
    try {
      const emi = await storage.getEMI(req.params.id);
      if (!emi) return res.status(404).json({ message: "EMI record not found" });

      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (req.user.role !== 'admin' && (!employee || (emi.employeeId._id || emi.employeeId).toString() !== (employee._id || employee.id).toString())) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=EMI_Invoice_${req.params.id}.pdf`);
      
      doc.pipe(res);

      doc.fontSize(20).text('EMI Payment Invoice', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Invoice Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.text(`Invoice ID: ${emi._id || emi.id}`, { align: 'right' });
      doc.moveDown();

      doc.fontSize(14).text('Employee Details:', { underline: true });
      doc.fontSize(12);
      doc.text(`Name: ${emi.employeeId.firstName} ${emi.employeeId.lastName}`);
      doc.text(`Email: ${emi.employeeId.email}`);
      doc.moveDown();

      doc.fontSize(14).text('Payment Details:', { underline: true });
      doc.fontSize(12);
      doc.text(`Payment Date: ${new Date(emi.paymentDate).toLocaleDateString()}`);
      doc.text(`Amount Paid: ₹${emi.amount.toFixed(2)}`);
      doc.text(`Payment Method: ${emi.paymentMethod.toUpperCase()}`);
      doc.text(`Transaction ID: ${emi.transactionId}`);
      if (emi.paypalOrderId) {
        doc.text(`PayPal Order ID: ${emi.paypalOrderId}`);
      }
      doc.text(`Status: ${emi.status.toUpperCase()}`);
      doc.moveDown();

      if (emi.loanId) {
        doc.fontSize(14).text('Loan Details:', { underline: true });
        doc.fontSize(12);
        doc.text(`Loan Amount: ₹${emi.loanId.loanAmount.toFixed(2)}`);
        doc.text(`Monthly EMI: ₹${emi.loanId.monthlyEmi.toFixed(2)}`);
        doc.text(`Pending Amount: ₹${emi.loanId.pendingAmount.toFixed(2)}`);
        doc.moveDown();
      }

      doc.fontSize(10).text('This is a computer-generated invoice and does not require a signature.', { 
        align: 'center',
        color: 'gray'
      });

      doc.end();
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  /*** PAYROLL PROCESSING ROUTES ***/
  // Get employees with pending payroll (not paid for current month)
  app.get('/api/payroll/pending-employees', requireAdmin, async (req, res) => {
    try {
      const { Payslip, Employee } = await import("../shared/mongoose-schema.js");
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // Get all active employees
      const activeEmployees = await Employee.find({ status: 'active' });
      
      // Filter employees by hire date first
      const eligibleEmployees = activeEmployees.filter(employee => {
        if (!employee.hireDate) return true; // Include if no hire date (fallback)
        const hireDate = new Date(employee.hireDate);
        const hireMonth = hireDate.getMonth() + 1;
        const hireYear = hireDate.getFullYear();
        return hireYear < currentYear || (hireYear === currentYear && hireMonth <= currentMonth);
      });
      
      // Batch query: Get all paid payslips for current month for eligible employees
      const employeeIds = eligibleEmployees.map(emp => emp._id || emp.id);
      const paidPayslips = await Payslip.find({ 
        employeeId: { $in: employeeIds },
        month: currentMonth, 
        year: currentYear,
        paymentStatus: 'paid'
      });
      
      // Create a Set of employee IDs who have been paid
      const paidEmployeeIds = new Set(paidPayslips.map(p => p.employeeId.toString()));
      
      // Filter out employees who have already been paid
      const pendingEmployees = eligibleEmployees.filter(emp => 
        !paidEmployeeIds.has((emp._id || emp.id).toString())
      );
      
      res.json(pendingEmployees);
    } catch (error) {
      console.error('Error getting pending employees:', error);
      res.status(500).json({ message: 'Failed to get pending employees' });
    }
  });

  // Get pending months for employee(s)
  app.get('/api/payroll/pending-months/:employeeId?', requireAdmin, async (req, res) => {
    try {
      const { Payslip, Employee } = await import("../shared/mongoose-schema.js");
      const employeeId = req.params.employeeId;
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const pendingMonthsSet = new Set();
      
      if (employeeId) {
        // Individual mode: check pending months for specific employee
        // Only show current month (October 2025) as per requirements
        const employee = await Employee.findById(employeeId);
        if (!employee) {
          return res.status(404).json({ message: 'Employee not found' });
        }
        
        const hireDate = new Date(employee.hireDate);
        const hireMonth = hireDate.getMonth() + 1;
        const hireYear = hireDate.getFullYear();
        
        // Only show current month if employee was hired before or during current month
        if (hireYear < currentYear || (hireYear === currentYear && hireMonth <= currentMonth)) {
          const existingPayslip = await Payslip.findOne({ 
            employeeId, 
            month: currentMonth, 
            year: currentYear 
          });
          
          if (!existingPayslip) {
            pendingMonthsSet.add(`${currentMonth}-${currentYear}`);
          }
        }
      } else {
        // Bulk mode: check current month for all active employees
        const activeEmployees = await Employee.find({ status: 'active' });
        
        for (const employee of activeEmployees) {
          const hireDate = new Date(employee.hireDate);
          const hireMonth = hireDate.getMonth() + 1;
          const hireYear = hireDate.getFullYear();
          
          // Only show current month if employee was hired before or during current month
          if (hireYear < currentYear || (hireYear === currentYear && hireMonth <= currentMonth)) {
            const existingPayslip = await Payslip.findOne({ 
              employeeId: employee._id || employee.id, 
              month: currentMonth, 
              year: currentYear 
            });
            
            if (!existingPayslip) {
              pendingMonthsSet.add(`${currentMonth}-${currentYear}`);
            }
          }
        }
      }
      
      // Convert set back to array with proper format
      const pendingMonths = Array.from(pendingMonthsSet).map(key => {
        const [month, year] = key.split('-').map(Number);
        return { month, year, label: `${getMonthName(month)} ${year}` };
      }).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      
      res.json(pendingMonths);
    } catch (error) {
      console.error('Error getting pending months:', error);
      res.status(500).json({ message: 'Failed to get pending months' });
    }
  });
  
  // Calculate payroll for individual or multiple employees
  app.post('/api/payroll/calculate', requireAdmin, async (req, res) => {
    try {
      const { Profile } = await import("../shared/mongoose-schema.js");
      const { employeeIds, months, constants } = req.body; // months is array of {month, year}
      
      console.log('[payroll] Calculate request received:', {
        employeeCount: employeeIds?.length,
        monthCount: months?.length,
        constants
      });
      
      // Validate and sanitize constants from UI or use defaults
      // Check for null/undefined before conversion to prevent null -> 0 coercion
      const hraVal = constants?.hraPercentage != null ? Number(constants.hraPercentage) : NaN;
      const travelVal = constants?.travelAllowance != null ? Number(constants.travelAllowance) : NaN;
      const overtimeVal = constants?.overtimeRatePerHour != null ? Number(constants.overtimeRatePerHour) : NaN;
      
      // Use Number.isFinite to distinguish between NaN and valid 0
      let hraPercentage = Number.isFinite(hraVal) ? hraVal : 0.20;
      let travelAllowance = Number.isFinite(travelVal) ? travelVal : 2000;
      let overtimeRatePerHour = Number.isFinite(overtimeVal) ? overtimeVal : 200;
      
      // Validate range after assignment
      if (hraPercentage < 0 || hraPercentage > 1) {
        console.log('[payroll] HRA percentage out of range, using default 0.20');
        hraPercentage = 0.20;
      }
      if (travelAllowance < 0) {
        console.log('[payroll] Travel allowance negative, using default 2000');
        travelAllowance = 2000;
      }
      if (overtimeRatePerHour < 0) {
        console.log('[payroll] Overtime rate negative, using default 200');
        overtimeRatePerHour = 200;
      }
      
      console.log('[payroll] Using constants:', { hraPercentage, travelAllowance, overtimeRatePerHour });
      
      const calculations = [];
      
      for (const empId of employeeIds) {
        const employee = await storage.getEmployee(empId);
        if (!employee) continue;
        
        const profile = await Profile.findOne({ employeeId: empId });
        if (!profile) continue;
        
        for (const periodData of months) {
          const { month, year } = periodData;
          
          // Get attendance summary for this month
          const attendanceResponse = await fetch(
            `http://localhost:${process.env.PORT || 5000}/api/attendance/summary?month=${month}&year=${year}`,
            { headers: { cookie: req.headers.cookie } }
          );
          const attendanceSummary = await attendanceResponse.json();
          const empAttendance = attendanceSummary.find(a => a.id === empId);
          
          if (!empAttendance) continue;
          
          // Payroll calculation
          const basicSalary = profile.salary;
          
          // Calculations
          const workingDays = empAttendance.workingDays || 1;
          const dailySalary = basicSalary / workingDays;
          const payableDays = empAttendance.payableDays;
          const salaryForPayableDays = dailySalary * payableDays;
          const hraAmount = basicSalary * hraPercentage;
          const overtimePay = empAttendance.overtimeHours * overtimeRatePerHour;
          const latePenalty = empAttendance.lateComingDays * dailySalary * 0.1;
          const netSalary = salaryForPayableDays + hraAmount + travelAllowance + overtimePay - latePenalty;
          
          calculations.push({
            employeeId: empId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            email: profile.email,
            month,
            year,
            basicSalary,
            hraPercentage,
            hraAmount,
            travelAllowance,
            overtimeRatePerHour,
            ...empAttendance,
            dailySalary,
            salaryForPayableDays,
            overtimePay,
            latePenalty,
            netSalary
          });
        }
      }
      
      res.json(calculations);
    } catch (error) {
      console.error('Error calculating payroll:', error);
      res.status(500).json({ message: 'Failed to calculate payroll', error: error.message });
    }
  });
  
  // Create PayPal order for payroll payment
  app.post('/api/payroll/paypal-order', requireAdmin, async (req, res) => {
    try {
      const { payrollData } = req.body; // Array of payroll calculations
      console.log('[payroll] Creating PayPal order for', payrollData.length, 'employees');
      
      const totalAmount = payrollData.reduce((sum, p) => sum + p.netSalary, 0);
      console.log('[payroll] Total amount:', totalAmount);
      
      if (!totalAmount || totalAmount <= 0) {
        throw new Error('Invalid total amount: ' + totalAmount);
      }
      
      const orderPayload = {
        body: {
          amount: totalAmount.toFixed(2),
          currency: 'USD',
          intent: 'CAPTURE'
        }
      };
      
      await createPaypalOrder({ body: orderPayload.body }, res);
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      res.status(500).json({ message: 'Failed to create PayPal order', error: error.message });
    }
  });
  
  // Capture PayPal payment and generate payslips
  app.post('/api/payroll/paypal-capture/:orderId', requireAdmin, async (req, res) => {
    try {
      const { Payslip, Payroll } = await import("../shared/mongoose-schema.js");
      const { sendSalaryNotification } = await import("./email.js");
      const { payrollData } = req.body; // Array of payroll calculations
      console.log('[payroll] Capturing PayPal order:', req.params.orderId);
      
      const captureReq = {
        params: { orderID: req.params.orderId }
      };

      const captureRes = {
        statusCode: 200,
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: async function(captureData) {
          if (this.statusCode === 200 || this.statusCode === 201) {
            console.log('[payroll] PayPal order captured successfully');
            const transactionId = captureData.id || req.params.orderId;
            
            const payslips = [];
            const payrolls = [];
            const emailPromises = [];
            
            for (const data of payrollData) {
              const payslip = new Payslip({
                employeeId: data.employeeId,
                employeeName: data.employeeName,
                email: data.email,
                month: data.month,
                year: data.year,
                basicSalary: data.basicSalary,
                hraAmount: data.hraAmount,
                travelAllowance: data.travelAllowance,
                overtimePay: data.overtimePay,
                latePenalty: data.latePenalty,
                grossSalary: data.salaryForPayableDays + data.hraAmount + data.travelAllowance,
                deductions: data.latePenalty,
                netSalary: data.netSalary,
                payableDays: data.payableDays,
                presentDays: data.presentDays,
                leaveDays: data.leaveDays,
                absentDays: data.absentDays,
                lateComingDays: data.lateComingDays,
                overtimeHours: data.overtimeHours,
                paymentStatus: 'paid',
                paymentMode: 'online',
                transactionId,
                paypalOrderId: req.params.orderId,
                paidDate: new Date()
              });
              
              await payslip.save();
              payslips.push(payslip);
              
              const payroll = new Payroll({
                employeeId: data.employeeId,
                payPeriod: `${getMonthName(data.month)} ${data.year}`,
                baseSalary: data.basicSalary,
                allowances: data.hraAmount + data.travelAllowance + data.overtimePay,
                deductions: data.latePenalty,
                netSalary: data.netSalary,
                payDate: new Date(),
                status: 'paid'
              });
              
              await payroll.save();
              payrolls.push(payroll);
              
              // Send email notification to employee
              emailPromises.push(
                sendSalaryNotification(
                  data.email,
                  data.employeeName,
                  data.month,
                  data.year,
                  data.netSalary,
                  transactionId
                ).catch(err => {
                  console.error(`Failed to send email to ${data.email}:`, err);
                })
              );
            }
            
            // Send all emails in parallel
            await Promise.all(emailPromises);
            console.log(`[payroll] Sent ${emailPromises.length} email notification(s)`);
            
            res.json({
              success: true,
              transactionId,
              payslips,
              payrolls,
              paypalData: captureData
            });
          } else {
            res.status(this.statusCode).json(captureData);
          }
        }
      };

      await capturePaypalOrder(captureReq, captureRes);
    } catch (error) {
      console.error('Error capturing payment:', error);
      res.status(500).json({ message: 'Failed to capture payment' });
    }
  });
  
  // Get payslips for employee
  app.get('/api/payslips', requireAuth, async (req, res) => {
    try {
      const { Payslip } = await import("../shared/mongoose-schema.js");
      
      if (req.user.role === 'admin') {
        const payslips = await Payslip.find().sort({ year: -1, month: -1 });
        res.json(payslips);
      } else {
        const employee = await storage.getEmployeeByUserId(req.user.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        
        const payslips = await Payslip.find({ employeeId: employee._id || employee.id }).sort({ year: -1, month: -1 });
        res.json(payslips);
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
      res.status(500).json({ message: 'Failed to fetch payslips' });
    }
  });

  // Delete payslip (admin only)
  app.delete('/api/payslips/:id', requireAdmin, async (req, res) => {
    try {
      const { Payslip } = await import("../shared/mongoose-schema.js");
      
      const payslip = await Payslip.findByIdAndDelete(req.params.id);
      if (!payslip) {
        return res.status(404).json({ message: 'Payslip not found' });
      }
      
      res.json({ message: 'Payslip deleted successfully' });
    } catch (error) {
      console.error('Error deleting payslip:', error);
      res.status(500).json({ message: 'Failed to delete payslip' });
    }
  });

  // Download Excel template for bulk payroll upload (MUST be before :id/download route)
  app.get('/api/payslips/template/download', requireAdmin, async (req, res) => {
    try {
      const XLSX = (await import('xlsx')).default;
      
      // Define template headers based on payslipSchema - ALL fields included
      const headers = [
        'employeeId', 'employeeName', 'email', 'month', 'year',
        'basicSalary', 'hraAmount', 'travelAllowance', 'overtimePay', 
        'latePenalty', 'grossSalary', 'deductions', 'netSalary',
        'payableDays', 'presentDays', 'leaveDays', 'absentDays',
        'lateComingDays', 'overtimeHours', 'paymentStatus', 'paymentMode',
        'transactionId', 'paypalOrderId', 'paidDate'
      ];
      
      // Create worksheet with headers only
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Template');
      
      // Generate Excel file buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Payroll_Template.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({ message: 'Failed to generate template' });
    }
  });

  // Download payslip as PDF
  app.get('/api/payslips/:id/download', requireAuth, async (req, res) => {
    try {
      const { Payslip } = await import("../shared/mongoose-schema.js");
      const { generatePayslipPDF } = await import("./payslip-pdf.js");
      
      const payslip = await Payslip.findById(req.params.id);
      if (!payslip) {
        return res.status(404).json({ message: 'Payslip not found' });
      }

      // Check authorization: employees can only download their own payslips
      if (req.user.role !== 'admin') {
        const employee = await storage.getEmployeeByUserId(req.user.id);
        if (!employee || payslip.employeeId.toString() !== (employee._id || employee.id).toString()) {
          return res.status(403).json({ message: 'Unauthorized access' });
        }
      }

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const filename = `Payslip_${payslip.employeeName.replace(/\s+/g, '_')}_${monthNames[payslip.month - 1]}_${payslip.year}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      generatePayslipPDF(payslip, res);
    } catch (error) {
      console.error('Error generating payslip PDF:', error);
      res.status(500).json({ message: 'Failed to generate payslip PDF' });
    }
  });

  // Upload bulk offline payroll from Excel
  app.post('/api/payslips/bulk-upload', requireAdmin, async (req, res) => {
    try {
      const multer = await import('multer');
      const XLSX = (await import('xlsx')).default;
      const { Payslip, Employee } = await import("../shared/mongoose-schema.js");
      
      // Configure multer for memory storage
      const upload = multer.default({ storage: multer.default.memoryStorage() }).single('file');
      
      // Handle file upload
      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: 'File upload error' });
        }
        
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }
        
        try {
          // Parse Excel file
          const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          
          if (data.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty' });
          }
          
          const errors = [];
          const validPayslips = [];
          
          // Validate and process each row
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // Excel row number (accounting for header)
            
            // Check for required fields
            const requiredFields = [
              'employeeId', 'employeeName', 'email', 'month', 'year',
              'basicSalary', 'hraAmount', 'travelAllowance', 'grossSalary',
              'netSalary', 'payableDays', 'presentDays'
            ];
            
            const missingFields = requiredFields.filter(field => !row[field] && row[field] !== 0);
            
            if (missingFields.length > 0) {
              errors.push(`Row ${rowNum}: Missing required fields: ${missingFields.join(', ')}`);
              continue;
            }
            
            // Verify employee exists
            const employee = await Employee.findById(row.employeeId);
            if (!employee) {
              errors.push(`Row ${rowNum}: Employee with ID ${row.employeeId} not found`);
              continue;
            }
            
            // Verify email matches
            if (employee.email !== row.email) {
              errors.push(`Row ${rowNum}: Email mismatch for employee ${row.employeeName}`);
              continue;
            }
            
            // Create payslip object - optional fields remain undefined if not provided
            const payslip = {
              employeeId: row.employeeId,
              employeeName: row.employeeName,
              email: row.email,
              month: Number(row.month),
              year: Number(row.year),
              basicSalary: Number(row.basicSalary),
              hraAmount: Number(row.hraAmount),
              travelAllowance: Number(row.travelAllowance),
              overtimePay: Number(row.overtimePay) || 0,
              latePenalty: Number(row.latePenalty) || 0,
              grossSalary: Number(row.grossSalary),
              deductions: Number(row.deductions) || 0,
              netSalary: Number(row.netSalary),
              payableDays: Number(row.payableDays),
              presentDays: Number(row.presentDays),
              leaveDays: Number(row.leaveDays) || 0,
              absentDays: Number(row.absentDays) || 0,
              lateComingDays: Number(row.lateComingDays) || 0,
              overtimeHours: Number(row.overtimeHours) || 0,
              ...(row.paymentStatus && { paymentStatus: row.paymentStatus }),
              ...(row.paymentMode && { paymentMode: row.paymentMode }),
              ...(row.transactionId && { transactionId: row.transactionId }),
              ...(row.paypalOrderId && { paypalOrderId: row.paypalOrderId }),
              ...(row.paidDate && { paidDate: new Date(row.paidDate) })
            };
            
            validPayslips.push(payslip);
          }
          
          // If there are errors, return them
          if (errors.length > 0 && validPayslips.length === 0) {
            return res.status(400).json({ 
              message: 'Validation failed',
              errors: errors
            });
          }
          
          // Insert valid payslips
          if (validPayslips.length > 0) {
            await Payslip.insertMany(validPayslips);
          }
          
          // Return success with any warnings
          res.json({
            message: `Successfully uploaded ${validPayslips.length} payslip records`,
            count: validPayslips.length,
            errors: errors.length > 0 ? errors : undefined
          });
          
        } catch (parseError) {
          console.error('Error parsing Excel:', parseError);
          res.status(500).json({ message: 'Failed to parse Excel file' });
        }
      });
    } catch (error) {
      console.error('Error in bulk upload:', error);
      res.status(500).json({ message: 'Failed to upload payroll data' });
    }
  });

  // REPORT ROUTES
  app.get('/api/reports/summary', requireAdmin, async (req, res) => {
    try {
      const { Payslip, Employee, LeaveRequest, Attendance } = await import("../shared/mongoose-schema.js");
      const { dateRange } = req.query;
      const { startDate, endDate } = getDateRange(dateRange || 'current-month');

      const totalEmployees = await Employee.countDocuments({ status: 'active' });
      
      const payslips = await Payslip.find({
        paidDate: { $gte: startDate, $lte: endDate }
      });
      
      const totalPayroll = payslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);

      const attendanceRecords = await Attendance.find({
        date: { $gte: startDate, $lte: endDate }
      });

      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
      const avgAttendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      const pendingLeaves = await LeaveRequest.countDocuments({ 
        status: 'pending',
        startDate: { $gte: startDate }
      });

      res.json({
        totalEmployees,
        totalPayroll,
        avgAttendance,
        pendingLeaves
      });
    } catch (error) {
      console.error('Error fetching summary stats:', error);
      res.status(500).json({ message: 'Failed to fetch summary stats' });
    }
  });

  app.get('/api/reports/payroll', requireAdmin, async (req, res) => {
    try {
      const { Payslip, Employee } = await import("../shared/mongoose-schema.js");
      const { dateRange } = req.query;
      const { startDate, endDate } = getDateRange(dateRange || 'current-month');

      const payslips = await Payslip.find({
        paidDate: { $gte: startDate, $lte: endDate }
      }).populate('employeeId');

      const chartData = [];
      const monthlyData = {};

      payslips.forEach(payslip => {
        const monthKey = `${payslip.month}/${payslip.year}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: getMonthName(payslip.month),
            year: payslip.year,
            totalPayroll: 0,
            count: 0
          };
        }
        monthlyData[monthKey].totalPayroll += payslip.netSalary;
        monthlyData[monthKey].count += 1;
      });

      Object.values(monthlyData).forEach(data => {
        chartData.push({
          name: `${data.month} ${data.year}`,
          totalPayroll: data.totalPayroll,
          avgPayroll: Math.round(data.totalPayroll / data.count)
        });
      });

      const tableData = await Promise.all(payslips.map(async (payslip) => {
        const employee = await Employee.findById(payslip.employeeId);
        return {
          id: payslip.id,
          employeeName: payslip.employeeName,
          department: employee?.department || 'N/A',
          basicSalary: payslip.basicSalary,
          overtime: payslip.overtimePay,
          deductions: payslip.deductions + payslip.latePenalty,
          netPay: payslip.netSalary,
          status: payslip.paymentStatus
        };
      }));

      res.json({ chartData, tableData });
    } catch (error) {
      console.error('Error fetching payroll report:', error);
      res.status(500).json({ message: 'Failed to fetch payroll report' });
    }
  });

  app.get('/api/reports/attendance', requireAdmin, async (req, res) => {
    try {
      const { Attendance, Employee } = await import("../shared/mongoose-schema.js");
      const { dateRange } = req.query;
      const { startDate, endDate } = getDateRange(dateRange || 'current-month');

      const attendanceRecords = await Attendance.find({
        date: { $gte: startDate, $lte: endDate }
      });

      const employeeStats = {};
      
      attendanceRecords.forEach(record => {
        const empId = record.employeeId.toString();
        if (!employeeStats[empId]) {
          employeeStats[empId] = {
            employeeId: empId,
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
            totalDays: 0
          };
        }
        
        employeeStats[empId].totalDays += 1;
        if (record.status === 'present') employeeStats[empId].presentDays += 1;
        if (record.status === 'absent') employeeStats[empId].absentDays += 1;
        if (record.status === 'late') employeeStats[empId].lateDays += 1;
      });

      const chartData = {
        present: 0,
        absent: 0,
        late: 0
      };

      const tableData = await Promise.all(Object.values(employeeStats).map(async (stat) => {
        const employee = await Employee.findById(stat.employeeId);
        const attendancePercentage = stat.totalDays > 0 
          ? Math.round((stat.presentDays / stat.totalDays) * 100) 
          : 0;

        chartData.present += stat.presentDays;
        chartData.absent += stat.absentDays;
        chartData.late += stat.lateDays;

        return {
          id: stat.employeeId,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
          department: employee?.department || 'N/A',
          presentDays: stat.presentDays,
          absentDays: stat.absentDays,
          lateDays: stat.lateDays,
          attendancePercentage
        };
      }));

      const chartDataArray = [
        { name: 'Present', value: chartData.present, fill: '#10b981' },
        { name: 'Absent', value: chartData.absent, fill: '#ef4444' },
        { name: 'Late', value: chartData.late, fill: '#f59e0b' }
      ];

      res.json({ chartData: chartDataArray, tableData });
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      res.status(500).json({ message: 'Failed to fetch attendance report' });
    }
  });

  app.get('/api/reports/employees', requireAdmin, async (req, res) => {
    try {
      const { Employee } = await import("../shared/mongoose-schema.js");
      const { dateRange } = req.query;
      const { startDate, endDate } = getDateRange(dateRange || 'current-month');

      const employees = await Employee.find({ status: 'active' });

      const departmentStats = {};
      const salaryRanges = {
        '0-30k': 0,
        '30k-50k': 0,
        '50k-75k': 0,
        '75k+': 0
      };

      employees.forEach(emp => {
        if (!departmentStats[emp.department]) {
          departmentStats[emp.department] = { count: 0, totalSalary: 0 };
        }
        departmentStats[emp.department].count += 1;
        departmentStats[emp.department].totalSalary += emp.salary;

        if (emp.salary < 30000) salaryRanges['0-30k'] += 1;
        else if (emp.salary < 50000) salaryRanges['30k-50k'] += 1;
        else if (emp.salary < 75000) salaryRanges['50k-75k'] += 1;
        else salaryRanges['75k+'] += 1;
      });

      const departmentChartData = Object.entries(departmentStats).map(([dept, stats]) => ({
        name: dept,
        employees: stats.count,
        avgSalary: Math.round(stats.totalSalary / stats.count)
      }));

      const salaryChartData = Object.entries(salaryRanges).map(([range, count]) => ({
        name: range,
        value: count,
        fill: range === '0-30k' ? '#3b82f6' : range === '30k-50k' ? '#10b981' : range === '50k-75k' ? '#f59e0b' : '#ef4444'
      }));

      const tableData = employees.map(emp => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        department: emp.department,
        position: emp.position,
        hireDate: emp.hireDate,
        salary: emp.salary,
        status: emp.status
      }));

      res.json({ 
        departmentChartData, 
        salaryChartData,
        tableData 
      });
    } catch (error) {
      console.error('Error fetching employee report:', error);
      res.status(500).json({ message: 'Failed to fetch employee report' });
    }
  });

  app.get('/api/reports/export', requireAdmin, async (req, res) => {
    try {
      const { dateRange } = req.query;
      const { Payslip, Employee, Attendance, LeaveRequest } = await import("../shared/mongoose-schema.js");
      const { startDate, endDate } = getDateRange(dateRange || 'current-month');

      const doc = new PDFDocument({ margin: 50 });
      
      const dateRangeLabel = dateRange.replace('-', ' ').toUpperCase();
      const filename = `Loco_Report_${dateRangeLabel.replace(/\s/g, '_')}_${Date.now()}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);

      doc.fontSize(24).text('Loco - Comprehensive Report', { align: 'center' });
      doc.fontSize(14).text(`Period: ${dateRangeLabel}`, { align: 'center' });
      doc.moveDown(2);

      const totalEmployees = await Employee.countDocuments({ status: 'active' });
      const payslips = await Payslip.find({ paidDate: { $gte: startDate, $lte: endDate } });
      const totalPayroll = payslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);
      const attendanceRecords = await Attendance.find({ date: { $gte: startDate, $lte: endDate } });
      const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
      const avgAttendance = attendanceRecords.length > 0 ? Math.round((presentDays / attendanceRecords.length) * 100) : 0;
      const pendingLeaves = await LeaveRequest.countDocuments({ status: 'pending' });

      doc.fontSize(16).text('Summary Statistics', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Total Employees: ${totalEmployees}`);
      doc.text(`Total Payroll: $${totalPayroll.toLocaleString()}`);
      doc.text(`Average Attendance: ${avgAttendance}%`);
      doc.text(`Pending Leaves: ${pendingLeaves}`);
      doc.moveDown(2);

      doc.fontSize(16).text('Payroll Report', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      
      if (payslips.length > 0) {
        payslips.slice(0, 10).forEach((payslip, idx) => {
          doc.text(`${idx + 1}. ${payslip.employeeName} - $${payslip.netSalary.toLocaleString()} (${payslip.paymentStatus})`);
        });
        if (payslips.length > 10) {
          doc.text(`... and ${payslips.length - 10} more payslips`);
        }
      } else {
        doc.text('No payroll data for this period');
      }
      doc.moveDown(2);

      doc.fontSize(16).text('Attendance Report', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
      const absentCount = attendanceRecords.filter(a => a.status === 'absent').length;
      const lateCount = attendanceRecords.filter(a => a.status === 'late').length;
      doc.text(`Present Days: ${presentCount}`);
      doc.text(`Absent Days: ${absentCount}`);
      doc.text(`Late Days: ${lateCount}`);
      doc.moveDown(2);

      doc.fontSize(16).text('Employee Report', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      const employees = await Employee.find({ status: 'active' }).limit(10);
      employees.forEach((emp, idx) => {
        doc.text(`${idx + 1}. ${emp.firstName} ${emp.lastName} - ${emp.department} ($${emp.salary.toLocaleString()})`);
      });

      doc.end();
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ message: 'Failed to export report' });
    }
  });

  /*** CALENDAR ROUTES ***/
  
  // Get all calendar entries
  app.get("/api/calendar", requireAuth, async (req, res) => {
    try {
      const calendarEntries = await Calendar.find().sort({ date: 1 });
      res.json(calendarEntries);
    } catch (error) {
      console.error('Error fetching calendar entries:', error);
      res.status(500).json({ message: "Failed to fetch calendar entries" });
    }
  });

  // Create new calendar entry (Admin only)
  app.post("/api/calendar", requireAdmin, async (req, res) => {
    try {
      const { date, day_type, color_code, title, description } = req.body;
      
      // Validate that the date is in the future
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate <= today) {
        return res.status(400).json({ message: "Cannot add holiday/half-day for past or current dates" });
      }

      // Check if entry already exists for this date
      const existingEntry = await Calendar.findOne({ date: selectedDate });
      if (existingEntry) {
        return res.status(400).json({ message: "Entry already exists for this date. Please update or delete it first." });
      }

      const calendarEntry = new Calendar({
        date: selectedDate,
        day_type,
        color_code,
        title: title || '',
        description: description || '',
        created_by: req.user.username || 'Admin'
      });

      await calendarEntry.save();
      res.status(201).json(calendarEntry);
    } catch (error) {
      console.error('Error creating calendar entry:', error);
      res.status(500).json({ message: "Failed to create calendar entry" });
    }
  });

  // Update calendar entry (Admin only)
  app.put("/api/calendar/:id", requireAdmin, async (req, res) => {
    try {
      const { day_type, color_code, title, description } = req.body;
      
      const calendarEntry = await Calendar.findById(req.params.id);
      if (!calendarEntry) {
        return res.status(404).json({ message: "Calendar entry not found" });
      }

      // Validate that the date is still in the future
      const entryDate = new Date(calendarEntry.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (entryDate <= today) {
        return res.status(400).json({ message: "Cannot update past or current date entries" });
      }

      calendarEntry.day_type = day_type;
      calendarEntry.color_code = color_code;
      calendarEntry.title = title || '';
      calendarEntry.description = description || '';

      await calendarEntry.save();
      res.json(calendarEntry);
    } catch (error) {
      console.error('Error updating calendar entry:', error);
      res.status(500).json({ message: "Failed to update calendar entry" });
    }
  });

  // Delete calendar entry (Admin only)
  app.delete("/api/calendar/:id", requireAdmin, async (req, res) => {
    try {
      const calendarEntry = await Calendar.findById(req.params.id);
      if (!calendarEntry) {
        return res.status(404).json({ message: "Calendar entry not found" });
      }

      // Validate that the date is in the future
      const entryDate = new Date(calendarEntry.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (entryDate <= today) {
        return res.status(400).json({ message: "Cannot delete past or current date entries" });
      }

      await Calendar.findByIdAndDelete(req.params.id);
      res.json({ message: "Calendar entry deleted successfully" });
    } catch (error) {
      console.error('Error deleting calendar entry:', error);
      res.status(500).json({ message: "Failed to delete calendar entry" });
    }
  });

  // ...rest of your routes...

  /*** MEETING ROUTES ***/
  
  // Schedule a new meeting (admin only)
  app.post('/api/meetings', requireAdmin, async (req, res) => {
    try {
      const { Meeting, insertMeetingSchema } = await import("../shared/mongoose-schema.js");
      const { nanoid } = await import('nanoid');
      
      const data = {
        ...req.body,
        date: new Date(req.body.date),
        roomName: `meeting-${nanoid(10)}`,
        createdBy: req.user.id,
        status: 'scheduled'
      };
      
      const validatedData = insertMeetingSchema.parse(data);
      const meeting = new Meeting(validatedData);
      await meeting.save();
      
      res.status(201).json(meeting);
    } catch (error) {
      console.error('Error creating meeting:', error);
      res.status(400).json({ message: 'Failed to create meeting', error: error.message });
    }
  });

  // Get all meetings
  app.get('/api/meetings', requireAuth, async (req, res) => {
    try {
      const { Meeting } = await import("../shared/mongoose-schema.js");
      
      const query = {};
      if (req.query.status) {
        query.status = req.query.status;
      }
      
      const meetings = await Meeting.find(query).sort({ date: -1 }).populate('createdBy', 'username');
      res.json(meetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      res.status(500).json({ message: 'Failed to fetch meetings' });
    }
  });

  // Get single meeting
  app.get('/api/meetings/:id', requireAuth, async (req, res) => {
    try {
      const { Meeting } = await import("../shared/mongoose-schema.js");
      
      const meeting = await Meeting.findById(req.params.id).populate('createdBy', 'username');
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
      
      res.json(meeting);
    } catch (error) {
      console.error('Error fetching meeting:', error);
      res.status(500).json({ message: 'Failed to fetch meeting' });
    }
  });

  // Start a meeting (admin only)
  app.patch('/api/meetings/:id/start', requireAdmin, async (req, res) => {
    try {
      const { Meeting } = await import("../shared/mongoose-schema.js");
      const { io } = await import("./index.js");
      
      const meeting = await Meeting.findByIdAndUpdate(
        req.params.id,
        { 
          status: 'ongoing',
          startedAt: new Date()
        },
        { new: true }
      );
      
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
      
      // Emit real-time notification to all users
      io.emit('meeting-started', {
        meetingId: meeting.id,
        title: meeting.title,
        roomName: meeting.roomName
      });
      
      res.json(meeting);
    } catch (error) {
      console.error('Error starting meeting:', error);
      res.status(500).json({ message: 'Failed to start meeting' });
    }
  });

  // Join a meeting (track attendance)
  app.patch('/api/meetings/:id/join', requireAuth, async (req, res) => {
    try {
      const { Meeting } = await import("../shared/mongoose-schema.js");
      const employee = await storage.getEmployeeByUserId(req.user.id);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      const meeting = await Meeting.findById(req.params.id);
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
      
      // Check if employee already joined
      const existingParticipant = meeting.participants.find(
        p => p.employeeId.toString() === employee._id.toString()
      );
      
      if (!existingParticipant) {
        meeting.participants.push({
          employeeId: employee._id,
          joined: true,
          joinedAt: new Date()
        });
        await meeting.save();
      }
      
      res.json(meeting);
    } catch (error) {
      console.error('Error joining meeting:', error);
      res.status(500).json({ message: 'Failed to join meeting' });
    }
  });

  // Complete a meeting (admin only)
  app.patch('/api/meetings/:id/complete', requireAdmin, async (req, res) => {
    try {
      const { Meeting } = await import("../shared/mongoose-schema.js");
      
      const meeting = await Meeting.findByIdAndUpdate(
        req.params.id,
        { 
          status: 'completed',
          completedAt: new Date()
        },
        { new: true }
      );
      
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
      
      res.json(meeting);
    } catch (error) {
      console.error('Error completing meeting:', error);
      res.status(500).json({ message: 'Failed to complete meeting' });
    }
  });

  // Delete a meeting (admin only)
  app.delete('/api/meetings/:id', requireAdmin, async (req, res) => {
    try {
      const { Meeting } = await import("../shared/mongoose-schema.js");
      
      const meeting = await Meeting.findByIdAndDelete(req.params.id);
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
      
      res.json({ message: 'Meeting deleted successfully' });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      res.status(500).json({ message: 'Failed to delete meeting' });
    }
  });

  /*** PROJECT ROUTES ***/
  import('./routes/projects.js').then(projectRoutes => {
    app.use('/api/projects', projectRoutes.default);
  });
}

function getDateRange(dateRange) {
  const now = new Date();
  let startDate, endDate;

  switch (dateRange) {
    case 'current-month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'last-month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case 'current-quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      break;
    case 'current-year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  return { startDate, endDate };
}

function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}