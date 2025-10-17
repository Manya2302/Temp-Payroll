import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum('role', ['admin', 'employee']);
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected']);
export const leaveTypeEnum = pgEnum('leave_type', ['sick', 'vacation', 'personal', 'maternity', 'paternity']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default('employee'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  department: text("department").notNull(),
  position: text("position").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  hireDate: timestamp("hire_date").notNull(),
  status: text("status").notNull().default('active'), // active, inactive, terminated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payrolls = pgTable("payrolls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  payPeriod: text("pay_period").notNull(), // e.g., "2024-03", "March 2024"
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  allowances: decimal("allowances", { precision: 10, scale: 2 }).default('0'),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default('0'),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  payDate: timestamp("pay_date"),
  status: text("status").notNull().default('pending'), // pending, paid
  createdAt: timestamp("created_at").defaultNow(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").notNull().default('pending'),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  date: timestamp("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  status: text("status").notNull(), // present, absent, late, half_day
  hoursWorked: decimal("hours_worked", { precision: 4, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  payrolls: many(payrolls),
  leaveRequests: many(leaveRequests),
  attendanceRecords: many(attendance),
}));

export const payrollsRelations = relations(payrolls, ({ one }) => ({
  employee: one(employees, {
    fields: [payrolls.employeeId],
    references: [employees.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveRequests.employeeId],
    references: [employees.id],
  }),
  approver: one(users, {
    fields: [leaveRequests.approvedBy],
    references: [users.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  employee: one(employees, {
    fields: [attendance.employeeId],
    references: [employees.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayrollSchema = createInsertSchema(payrolls).omit({
  id: true,
  createdAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  approvedBy: true,
  approvedAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});