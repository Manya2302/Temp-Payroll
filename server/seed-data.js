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
  try {
    console.log('[seed] Starting to seed dummy data...');

    // Create test employees
    const testEmployees = [
      {
        username: 'alice.johnson',
        password: 'alice123',
        role: 'employee',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@company.com',
        phone: '+1-555-0101',
        department: 'Marketing',
        position: 'Marketing Manager',
        salary: '65000',
        hireDate: new Date('2023-03-01'),
        status: 'active'
      },
      {
        username: 'bob.wilson',
        password: 'bob123',
        role: 'employee', 
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@company.com',
        phone: '+1-555-0102',
        department: 'Engineering',
        position: 'Software Engineer',
        salary: '72000',
        hireDate: new Date('2022-11-15'),
        status: 'active'
      },
      {
        username: 'carol.davis',
        password: 'carol123',
        role: 'employee',
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.davis@company.com',
        phone: '+1-555-0103',
        department: 'HR',
        position: 'HR Specialist',
        salary: '58000',
        hireDate: new Date('2023-05-10'),
        status: 'active'
      }
    ];

    // Create users and employees
    for (const empData of testEmployees) {
      let user = await storage.getUserByUsername(empData.username);
      if (!user) {
        user = await storage.createUser({
          username: empData.username,
          password: await hashPassword(empData.password),
          role: empData.role
        });
        console.log(`[seed] Created user: ${empData.username}`);
      }

      // Create employee profile
      const existingEmployee = await storage.getEmployeeByUserId(user.id);
      if (!existingEmployee) {
        await storage.createEmployee({
          userId: user.id,
          firstName: empData.firstName,
          lastName: empData.lastName,
          email: empData.email,
          phone: empData.phone,
          department: empData.department,
          position: empData.position,
          salary: empData.salary,
          hireDate: empData.hireDate,
          status: empData.status
        });
        console.log(`[seed] Created employee profile: ${empData.firstName} ${empData.lastName}`);
      }
    }

    // Get all employees for creating related data
    const employees = await storage.getAllEmployees();
    console.log(`[seed] Found ${employees.length} employees for creating related data`);

    // Create sample payroll records
    for (const employee of employees.slice(0, 3)) { // Take first 3 employees
      const payrollData = {
        employeeId: employee._id || employee.id,
        baseSalary: parseFloat(employee.salary) / 24, // Bi-weekly
        deductions: 500,
        netSalary: (parseFloat(employee.salary) / 24) - 500,
        payPeriod: 'biweekly',
        status: 'paid'
      };

      const existingPayroll = await storage.getPayrollsByEmployee(employee._id || employee.id);
      if (existingPayroll.length === 0) {
        await storage.createPayroll(payrollData);
        console.log(`[seed] Created payroll for ${employee.firstName} ${employee.lastName}`);
      }
    }

    // Create sample leave requests
    for (const employee of employees.slice(0, 2)) { // Take first 2 employees
      const startDate = new Date('2024-02-15');
      const endDate = new Date('2024-02-20');
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1; // Calculate days
      
      const leaveData = {
        employeeId: employee._id || employee.id,
        leaveType: 'vacation',
        startDate: startDate,
        endDate: endDate,
        days: days,
        reason: 'Family vacation',
        status: 'approved'
      };

      const existingLeaves = await storage.getLeaveRequestsByEmployee(employee._id || employee.id);
      if (existingLeaves.length === 0) {
        await storage.createLeaveRequest(leaveData);
        console.log(`[seed] Created leave request for ${employee.firstName} ${employee.lastName}`);
      }
    }

    // Create sample attendance records
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const employee of employees.slice(0, 3)) { // Take first 3 employees
      const existingAttendance = await storage.getAttendanceByEmployee(employee._id || employee.id);
      if (existingAttendance.length === 0) {
        // Create attendance for yesterday
        await storage.createAttendance({
          employeeId: employee._id || employee.id,
          date: yesterday,
          checkIn: new Date(yesterday.setHours(9, 0, 0, 0)),
          checkOut: new Date(yesterday.setHours(17, 30, 0, 0)),
          status: 'present'
        });
        
        // Create attendance for today (check-in only)
        await storage.createAttendance({
          employeeId: employee._id || employee.id,
          date: today,
          checkIn: new Date(today.setHours(8, 45, 0, 0)),
          status: 'present'
        });
        
        console.log(`[seed] Created attendance records for ${employee.firstName} ${employee.lastName}`);
      }
    }

    console.log('[seed] Dummy data seeding completed successfully!');
    
    // Log summary for testing
    console.log('[seed] ===== TEST CREDENTIALS =====');
    console.log('[seed] Admin: username=admin, password=admin@123');
    console.log('[seed] Employee 1: username=emp, password=emp@123');
    console.log('[seed] Employee 2: username=alice.johnson, password=alice123');
    console.log('[seed] Employee 3: username=bob.wilson, password=bob123');
    console.log('[seed] Employee 4: username=carol.davis, password=carol123');
    console.log('[seed] ===============================');

  } catch (error) {
    console.error('[seed] Error seeding dummy data:', error);
  }
}