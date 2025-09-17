import mongoose from 'mongoose';
import { z } from 'zod';

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee'
  }
}, {
  timestamps: true
});

// Add virtual id field for compatibility
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true
});

userSchema.set('toObject', {
  virtuals: true
});

// Employee Schema
const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: String,
  department: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  hireDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Payroll Schema
const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  payPeriod: {
    type: String,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  allowances: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  payDate: Date,
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Leave Request Schema
const leaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['sick', 'vacation', 'personal', 'maternity', 'paternity'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  days: {
    type: Number,
    required: true
  },
  reason: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true
});

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: Date,
  checkOut: Date,
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day'],
    required: true
  },
  hoursWorked: Number
}, {
  timestamps: true
});

// Models
export const User = mongoose.model('User', userSchema);
export const Employee = mongoose.model('Employee', employeeSchema);
export const Payroll = mongoose.model('Payroll', payrollSchema);
export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
export const Attendance = mongoose.model('Attendance', attendanceSchema);

// Zod Validation Schemas
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(['admin', 'employee']).optional()
});

export const insertEmployeeSchema = z.object({
  userId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().min(1),
  position: z.string().min(1),
  salary: z.number().positive(),
  hireDate: z.date(),
  status: z.enum(['active', 'inactive', 'terminated']).optional()
});

export const insertPayrollSchema = z.object({
  employeeId: z.string(),
  payPeriod: z.string(),
  baseSalary: z.number().positive(),
  allowances: z.number().default(0),
  deductions: z.number().default(0),
  netSalary: z.number().positive(),
  payDate: z.date().optional(),
  status: z.enum(['pending', 'paid']).optional()
});

export const insertLeaveRequestSchema = z.object({
  employeeId: z.string(),
  leaveType: z.enum(['sick', 'vacation', 'personal', 'maternity', 'paternity']),
  startDate: z.date(),
  endDate: z.date(),
  days: z.number().positive(),
  reason: z.string().optional()
});

export const insertAttendanceSchema = z.object({
  employeeId: z.string(),
  date: z.date(),
  checkIn: z.date().optional(),
  checkOut: z.date().optional(),
  status: z.enum(['present', 'absent', 'late', 'half_day']),
  hoursWorked: z.number().optional()
});