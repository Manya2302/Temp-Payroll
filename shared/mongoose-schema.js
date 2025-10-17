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
    required: false
  },
  email: {
    type: String,
    sparse: true,
    unique: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
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
  phone: Number,
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

// Profile Schema
const profileSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
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
  dob: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  bankAccount: {
    type: String,
    required: true
  },
  taxId: {
    type: String,
    required: true
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract'],
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  bankBranch: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Models
export const User = mongoose.model('User', userSchema);
export const Employee = mongoose.model('Employee', employeeSchema);
export const Payroll = mongoose.model('Payroll', payrollSchema);
export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
export const Attendance = mongoose.model('Attendance', attendanceSchema);
export const Profile = mongoose.model('Profile', profileSchema);

// Zod Validation Schemas
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1).optional(),
  email: z.string().email().optional(),
  googleId: z.string().optional(),
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

export const insertProfileSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.preprocess((val) => val ? new Date(val) : undefined, z.date({ required_error: "Date of birth is required" })),
  gender: z.string().min(1, "Gender is required"),
  phone: z.string().min(1, "Contact number is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(1, "Address is required"),
  department: z.string().min(1, "Department is required"),
  salary: z.number({ required_error: "Basic salary is required" }),
  bankAccount: z.string().min(1, "Bank account number is required"),
  taxId: z.string().min(1, "Tax ID / PAN / SSN is required"),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract']),
  bankName: z.string().min(1, "Bank name is required"),
  bankBranch: z.string().min(1, "Bank branch is required"),
});
// Quesry Schema 


const querySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  message: { type: String, required: true },
  answer: { type: String, default: "" }, 
  replied: { type: Boolean, default: false }, 
  ignored: { type: Boolean, default: false }  
}, { timestamps: true });

export const Query = mongoose.model('Query', querySchema);

const loanSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  loanAmount: {
    type: Number,
    required: true
  },
  repaymentPeriod: {
    type: Number,
    required: true
  },
  monthlyEmi: {
    type: Number,
    required: true
  },
  pendingAmount: {
    type: Number,
    required: true
  },
  nextDueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reason: {
    type: String,
    required: true
  },
  requestedDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: {
    type: Date
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

loanSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

loanSchema.set('toJSON', {
  virtuals: true
});

loanSchema.set('toObject', {
  virtuals: true
});

export const Loan = mongoose.model('Loan', loanSchema);

export const insertLoanSchema = z.object({
  employeeId: z.string(),
  loanAmount: z.number().positive(),
  repaymentPeriod: z.number().positive().int(),
  reason: z.string().min(1)
});

const emiSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['paypal', 'razorpay', 'cash', 'bank_transfer'],
    default: 'paypal',
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  paypalOrderId: {
    type: String
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed',
    required: true
  }
}, {
  timestamps: true
});

emiSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

emiSchema.set('toJSON', {
  virtuals: true
});

emiSchema.set('toObject', {
  virtuals: true
});

export const EMI = mongoose.model('EMI', emiSchema);

export const insertEMISchema = z.object({
  employeeId: z.string(),
  loanId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['paypal', 'razorpay', 'cash', 'bank_transfer']),
  transactionId: z.string().min(1),
  paypalOrderId: z.string().optional(),
  status: z.enum(['completed', 'pending', 'failed']).optional()
});

// Payslip Schema
const payslipSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  hraAmount: {
    type: Number,
    required: true
  },
  travelAllowance: {
    type: Number,
    required: true
  },
  overtimePay: {
    type: Number,
    default: 0
  },
  latePenalty: {
    type: Number,
    default: 0
  },
  grossSalary: {
    type: Number,
    required: true
  },
  deductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  payableDays: {
    type: Number,
    required: true
  },
  presentDays: {
    type: Number,
    required: true
  },
  leaveDays: {
    type: Number,
    default: 0
  },
  absentDays: {
    type: Number,
    default: 0
  },
  lateComingDays: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'paid'
  },
  paymentMode: {
    type: String,
    enum: ['online', 'cash', 'bank_transfer'],
    default: 'online'
  },
  transactionId: {
    type: String
  },
  paypalOrderId: {
    type: String
  },
  paidDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

payslipSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

payslipSchema.set('toJSON', {
  virtuals: true
});

payslipSchema.set('toObject', {
  virtuals: true
});

export const Payslip = mongoose.model('Payslip', payslipSchema);

export const insertPayslipSchema = z.object({
  employeeId: z.string(),
  employeeName: z.string(),
  email: z.string().email(),
  month: z.number().min(1).max(12),
  year: z.number(),
  basicSalary: z.number().positive(),
  hraAmount: z.number(),
  travelAllowance: z.number(),
  overtimePay: z.number().default(0),
  latePenalty: z.number().default(0),
  grossSalary: z.number().positive(),
  deductions: z.number().default(0),
  netSalary: z.number().positive(),
  payableDays: z.number(),
  presentDays: z.number(),
  leaveDays: z.number().default(0),
  absentDays: z.number().default(0),
  lateComingDays: z.number().default(0),
  overtimeHours: z.number().default(0),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).default('paid'),
  paymentMode: z.enum(['online', 'cash', 'bank_transfer']).default('online'),
  transactionId: z.string().optional(),
  paypalOrderId: z.string().optional(),
  paidDate: z.date().optional()
});

// Calendar Schema
const calendarSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  day_type: {
    type: String,
    enum: ['Holiday', 'Half Day', 'Normal'],
    required: true,
    default: 'Normal'
  },
  color_code: {
    type: String,
    required: true,
    default: '#FFFFFF'
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  created_by: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
});

calendarSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

calendarSchema.set('toJSON', {
  virtuals: true
});

calendarSchema.set('toObject', {
  virtuals: true
});

export const Calendar = mongoose.model('Calendar', calendarSchema);

// Meeting Schema
const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  agenda: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  roomName: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    joined: {
      type: Boolean,
      default: false
    },
    joinedAt: Date
  }],
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

meetingSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

meetingSchema.set('toJSON', {
  virtuals: true
});

meetingSchema.set('toObject', {
  virtuals: true
});

export const Meeting = mongoose.model('Meeting', meetingSchema);

export const insertMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().or(z.date()),
  time: z.string().min(1, 'Time is required'),
  description: z.string().optional(),
  agenda: z.string().optional(),
  reason: z.string().optional(),
  roomName: z.string().min(1, 'Room name is required'),
  createdBy: z.string().optional()
});