import { createServer } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
import express from 'express';
import {
  insertEmployeeSchema, insertPayrollSchema, insertLeaveRequestSchema,
  insertAttendanceSchema, Profile, insertProfileSchema, Query, insertLoanSchema
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

  // ...rest of your routes...
}