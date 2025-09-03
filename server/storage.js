import { 
  users, employees, payrolls, leaveRequests, attendance
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db.js";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage {
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser) {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserPassword(id, newPassword) {
    const [user] = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Employees
  async getEmployee(id) {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByUserId(userId) {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
    return employee || undefined;
  }

  async getAllEmployees() {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async createEmployee(insertEmployee) {
    const [employee] = await db
      .insert(employees)
      .values(insertEmployee)
      .returning();
    return employee;
  }

  async updateEmployee(id, updateEmployee) {
    const [employee] = await db
      .update(employees)
      .set({ ...updateEmployee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id) {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Payrolls
  async getPayroll(id) {
    const [payroll] = await db.select().from(payrolls).where(eq(payrolls.id, id));
    return payroll || undefined;
  }

  async getPayrollsByEmployee(employeeId) {
    return await db
      .select()
      .from(payrolls)
      .where(eq(payrolls.employeeId, employeeId))
      .orderBy(desc(payrolls.createdAt));
  }

  async getAllPayrolls() {
    return await db.select().from(payrolls).orderBy(desc(payrolls.createdAt));
  }

  async createPayroll(insertPayroll) {
    const [payroll] = await db
      .insert(payrolls)
      .values(insertPayroll)
      .returning();
    return payroll;
  }

  async updatePayroll(id, updatePayroll) {
    const [payroll] = await db
      .update(payrolls)
      .set(updatePayroll)
      .where(eq(payrolls.id, id))
      .returning();
    return payroll;
  }

  async deletePayroll(id) {
    await db.delete(payrolls).where(eq(payrolls.id, id));
  }

  // Leave Requests
  async getLeaveRequest(id) {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request || undefined;
  }

  async getLeaveRequestsByEmployee(employeeId) {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.employeeId, employeeId))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async getAllLeaveRequests() {
    return await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
  }

  async createLeaveRequest(insertRequest) {
    const [request] = await db
      .insert(leaveRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async updateLeaveRequest(id, updateRequest) {
    const [request] = await db
      .update(leaveRequests)
      .set(updateRequest)
      .where(eq(leaveRequests.id, id))
      .returning();
    return request;
  }

  async deleteLeaveRequest(id) {
    await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
  }

  // Attendance
  async getAttendance(id) {
    const [attendanceRecord] = await db.select().from(attendance).where(eq(attendance.id, id));
    return attendanceRecord || undefined;
  }

  async getAttendanceByEmployee(employeeId, startDate, endDate) {
    let conditions = [eq(attendance.employeeId, employeeId)];
    
    if (startDate && endDate) {
      conditions.push(
        gte(attendance.date, startDate),
        lte(attendance.date, endDate)
      );
    }
    
    return await db.select().from(attendance)
      .where(and(...conditions))
      .orderBy(desc(attendance.date));
  }

  async getAllAttendance() {
    return await db.select().from(attendance).orderBy(desc(attendance.date));
  }

  async createAttendance(insertAttendance) {
    const [record] = await db
      .insert(attendance)
      .values(insertAttendance)
      .returning();
    return record;
  }

  async updateAttendance(id, updateAttendance) {
    const [record] = await db
      .update(attendance)
      .set(updateAttendance)
      .where(eq(attendance.id, id))
      .returning();
    return record;
  }

  async deleteAttendance(id) {
    await db.delete(attendance).where(eq(attendance.id, id));
  }

  async getTodayAttendance(employeeId, today) {
    const [record] = await db.select().from(attendance)
      .where(and(
        eq(attendance.employeeId, employeeId),
        gte(attendance.date, today),
        lte(attendance.date, new Date(today.getTime() + 24 * 60 * 60 * 1000))
      ));
    return record || null;
  }

  // Dashboard Stats
  async getDashboardStats() {
    const [totalEmployees] = await db.select({ count: sql`count(*)` }).from(employees);
    const [totalPayroll] = await db.select({ 
      total: sql`COALESCE(sum(${payrolls.netSalary}), 0)` 
    }).from(payrolls);
    const [pendingLeaves] = await db.select({ count: sql`count(*)` })
      .from(leaveRequests)
      .where(eq(leaveRequests.status, 'pending'));
    const [presentToday] = await db.select({ count: sql`count(*)` })
      .from(attendance)
      .where(and(
        eq(attendance.status, 'present'),
        gte(attendance.date, new Date(new Date().toDateString()))
      ));

    return {
      totalEmployees: totalEmployees?.count || 0,
      totalPayroll: totalPayroll?.total || 0,
      pendingLeaves: pendingLeaves?.count || 0,
      presentToday: presentToday?.count || 0,
    };
  }

  async getEmployeeDashboardStats(employeeId) {
    const employee = await this.getEmployee(employeeId);
    const leaveRequests = await this.getLeaveRequestsByEmployee(employeeId);
    const attendanceRecords = await this.getAttendanceByEmployee(employeeId, 
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      new Date()
    );
    
    const pendingRequests = leaveRequests.filter(req => req.status === 'pending').length;
    const presentDays = attendanceRecords.filter(rec => rec.status === 'present').length;
    const totalDays = attendanceRecords.length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Calculate leave balance (assuming 30 days annual leave)
    const usedLeaves = leaveRequests
      .filter(req => req.status === 'approved')
      .reduce((sum, req) => sum + req.days, 0);
    const leaveBalance = 30 - usedLeaves;

    return {
      currentSalary: employee?.salary || 0,
      leaveBalance,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      pendingRequests,
    };
  }
}

export const storage = new DatabaseStorage();