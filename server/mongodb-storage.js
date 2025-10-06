// import { 
//   User, Employee, Payroll, LeaveRequest, Attendance
// } from "../shared/mongoose-schema.js";
// import mongoose from "mongoose";
// import session from "express-session";
// import MongoStore from "connect-mongo";

// export class DatabaseStorage {
//   constructor() {
//     if (!process.env.MONGODB_URL) {
//       throw new Error('MONGODB_URL is missing. Add MONGODB_URL to your environment variables.');
//     }
//     this.sessionStore = MongoStore.create({
//       client: mongoose.connection.getClient(),
//       touchAfter: 24 * 3600 // lazy session update
//     });
//   }

//   // Users
//   async getUser(id) {
//     try {
//       const user = await User.findById(id);
//       return user ? user.toObject() : undefined;
//     } catch (error) {
//       console.error('Error getting user:', error);
//       return undefined;
//     }
//   }
// async getTodayAttendance(employeeId, today) {
//     try {
//       const startOfDay = new Date(today);
//       startOfDay.setHours(0, 0, 0, 0);
//       const endOfDay = new Date(today);
//       endOfDay.setHours(23, 59, 59, 999);

//       const record = await Attendance.findOne({
//         employeeId,
//         date: { $gte: startOfDay, $lte: endOfDay }
//       });
      
//       return record ? record.toObject() : null;
//     } catch (error) {
//       console.error('Error getting today attendance:', error);
//       return null;
//     }
//   }
//   async getUserByUsername(username) {
//     try {
//       const user = await User.findOne({ username });
//       return user ? user.toObject() : undefined;
//     } catch (error) {
//       console.error('Error getting user by username:', error);
//       return undefined;
//     }
//   }

//   async createUser(insertUser) {
//     try {
//       const user = new User(insertUser);
//       await user.save();
//       return user.toObject();
//     } catch (error) {
//       console.error('Error creating user:', error);
//       throw error;
//     }
//   }

//   async updateUserPassword(id, newPassword) {
//     try {
//       const user = await User.findByIdAndUpdate(
//         id, 
//         { password: newPassword }, 
//         { new: true }
//       );
//       return user ? user.toObject() : undefined;
//     } catch (error) {
//       console.error('Error updating user password:', error);
//       throw error;
//     }
//   }

//   // Employees
//   async getEmployee(id) {
//     try {
//       const employee = await Employee.findById(id);
//       return employee ? employee.toObject() : undefined;
//     } catch (error) {
//       console.error('Error getting employee:', error);
//       return undefined;
//     }
//   }

//   async getEmployeeByUserId(userId) {
//     try {
//       const employee = await Employee.findOne({ userId });
//       return employee ? employee.toObject() : undefined;
//     } catch (error) {
//       console.error('Error getting employee by user ID:', error);
//       return undefined;
//     }
//   }

//   async getAllEmployees() {
//     try {
//       const employees = await Employee.find().sort({ createdAt: -1 });
//       return employees.map(emp => emp.toObject());
//     } catch (error) {
//       console.error('Error getting all employees:', error);
//       return [];
//     }
//   }

//   async createEmployee(insertEmployee) {
//     try {
//       const employee = new Employee(insertEmployee);
//       await employee.save();
//       return employee.toObject();
//     } catch (error) {
//   // console.error('Error creating employee:', error); // log removed
//       throw error;
//     }
//   }

//   async updateEmployee(id, updateEmployee) {
//     try {
//       const employee = await Employee.findByIdAndUpdate(
//         id, 
//         { ...updateEmployee, updatedAt: new Date() }, 
//         { new: true }
//       );
//       return employee ? employee.toObject() : undefined;
//     } catch (error) {
//       console.error('Error updating employee:', error);
//       throw error;
//     }
//   }

//   async deleteEmployee(id) {
//     try {
//       await Employee.findByIdAndDelete(id);
//     } catch (error) {
//       console.error('Error deleting employee:', error);
//       throw error;
//     }
//   }

//   // Payrolls
//   async getPayroll(id) {
//     try {
//       const payroll = await Payroll.findById(id);
//       return payroll ? payroll.toObject() : undefined;
//     } catch (error) {
//       console.error('Error getting payroll:', error);
//       return undefined;
//     }
//   }

//   async getPayrollsByEmployee(employeeId) {
//     try {
//       const payrolls = await Payroll.find({ employeeId }).sort({ createdAt: -1 });
//       return payrolls.map(payroll => payroll.toObject());
//     } catch (error) {
//       console.error('Error getting payrolls by employee:', error);
//       return [];
//     }
//   }

//   async getAllPayrolls() {
//     try {
//       const payrolls = await Payroll.find().sort({ createdAt: -1 });
//       return payrolls.map(payroll => payroll.toObject());
//     } catch (error) {
//       console.error('Error getting all payrolls:', error);
//       return [];
//     }
//   }

//   async createPayroll(insertPayroll) {
//     try {
//       const payroll = new Payroll(insertPayroll);
//       await payroll.save();
//       return payroll.toObject();
//     } catch (error) {
//       console.error('Error creating payroll:', error);
//       throw error;
//     }
//   }

//   async updatePayroll(id, updatePayroll) {
//     try {
//       const payroll = await Payroll.findByIdAndUpdate(
//         id, 
//         updatePayroll, 
//         { new: true }
//       );
//       return payroll ? payroll.toObject() : undefined;
//     } catch (error) {
//       console.error('Error updating payroll:', error);
//       throw error;
//     }
//   }

//   async deletePayroll(id) {
//     try {
//       await Payroll.findByIdAndDelete(id);
//     } catch (error) {
//       console.error('Error deleting payroll:', error);
//       throw error;
//     }
//   }

//   // Leave Requests
//   async getLeaveRequest(id) {
//     try {
//       const request = await LeaveRequest.findById(id);
//       return request ? request.toObject() : undefined;
//     } catch (error) {
//       console.error('Error getting leave request:', error);
//       return undefined;
//     }
//   }

//   async getLeaveRequestsByEmployee(employeeId) {
//     try {
//       const requests = await LeaveRequest.find({ employeeId }).sort({ createdAt: -1 });
//       return requests.map(req => req.toObject());
//     } catch (error) {
//       console.error('Error getting leave requests by employee:', error);
//       return [];
//     }
//   }

//   async getAllLeaveRequests() {
//     try {
//       const requests = await LeaveRequest.find().sort({ createdAt: -1 });
//       return requests.map(req => req.toObject());
//     } catch (error) {
//       console.error('Error getting all leave requests:', error);
//       return [];
//     }
//   }

//   async createLeaveRequest(insertRequest) {
//     try {
//       const request = new LeaveRequest(insertRequest);
//       await request.save();
//       return request.toObject();
//     } catch (error) {
//       console.error('Error creating leave request:', error);
//       throw error;
//     }
//   }

//   async updateLeaveRequest(id, updateRequest) {
//     try {
//       const request = await LeaveRequest.findByIdAndUpdate(
//         id, 
//         updateRequest, 
//         { new: true }
//       );
//       return request ? request.toObject() : undefined;
//     } catch (error) {
//       console.error('Error updating leave request:', error);
//       throw error;
//     }
//   }

//   async deleteLeaveRequest(id) {
//     try {
//       await LeaveRequest.findByIdAndDelete(id);
//     } catch (error) {
//       console.error('Error deleting leave request:', error);
//       throw error;
//     }
//   }

//   // Attendance
//   async getAttendance(id) {
//     try {
//       const attendanceRecord = await Attendance.findById(id);
//       return attendanceRecord ? attendanceRecord.toObject() : undefined;
//     } catch (error) {
//       console.error('Error getting attendance:', error);
//       return undefined;
//     }
//   }

//   async getAttendanceByEmployee(employeeId, startDate, endDate) {
//     try {
//       let query = { employeeId };
      
//       if (startDate && endDate) {
//         query.date = { $gte: startDate, $lte: endDate };
//       }
      
//       const records = await Attendance.find(query).sort({ date: -1 });
//       return records.map(record => record.toObject());
//     } catch (error) {
//       console.error('Error getting attendance by employee:', error);
//       return [];
//     }
//   }

//   async getAllAttendance() {
//     try {
//       const records = await Attendance.find().sort({ date: -1 });
//       return records.map(record => record.toObject());
//     } catch (error) {
//       console.error('Error getting all attendance:', error);
//       return [];
//     }
//   }

//   async createAttendance(insertAttendance) {
//     try {
//       const record = new Attendance(insertAttendance);
//       await record.save();
//       return record.toObject();
//     } catch (error) {
//       console.error('Error creating attendance:', error);
//       throw error;
//     }
//   }

//   async updateAttendance(id, updateAttendance) {
//     try {
//       const record = await Attendance.findByIdAndUpdate(
//         id, 
//         updateAttendance, 
//         { new: true }
//       );
//       return record ? record.toObject() : undefined;
//     } catch (error) {
//       console.error('Error updating attendance:', error);
//       throw error;
//     }
//   }

//   async deleteAttendance(id) {
//     try {
//       await Attendance.findByIdAndDelete(id);
//     } catch (error) {
//       console.error('Error deleting attendance:', error);
//       throw error;
//     }
//   }

  

//   // Dashboard Stats
//   async getDashboardStats() {
//     try {
//       const [totalEmployees, totalPayroll, pendingLeaves, presentToday] = await Promise.all([
//         Employee.countDocuments(),
//         Payroll.aggregate([{ $group: { _id: null, total: { $sum: "$netSalary" } } }]),
//         LeaveRequest.countDocuments({ status: 'pending' }),
//         Attendance.countDocuments({ 
//           status: 'present',
//           date: { $gte: new Date(new Date().toDateString()) }
//         })
//       ]);

//       return {
//         totalEmployees: totalEmployees || 0,
//         totalPayroll: totalPayroll[0]?.total || 0,
//         pendingLeaves: pendingLeaves || 0,
//         presentToday: presentToday || 0,
//       };
//     } catch (error) {
//       console.error('Error getting dashboard stats:', error);
//       return {
//         totalEmployees: 0,
//         totalPayroll: 0,
//         pendingLeaves: 0,
//         presentToday: 0,
//       };
//     }
//   }

//   async getEmployeeDashboardStats(employeeId) {
//     try {
//       const employee = await this.getEmployee(employeeId);
//       const leaveRequests = await this.getLeaveRequestsByEmployee(employeeId);
//       const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
//       const attendanceRecords = await this.getAttendanceByEmployee(employeeId, currentMonth, new Date());
      
//       const pendingRequests = leaveRequests.filter(req => req.status === 'pending').length;
//       const presentDays = attendanceRecords.filter(rec => rec.status === 'present').length;
//       const totalDays = attendanceRecords.length;
//       const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

//       // Calculate leave balance (assuming 30 days annual leave)
//       const usedLeaves = leaveRequests
//         .filter(req => req.status === 'approved')
//         .reduce((sum, req) => sum + req.days, 0);
//       const leaveBalance = 30 - usedLeaves;

//       return {
//         currentSalary: employee?.salary || 0,
//         leaveBalance,
//         attendanceRate: Math.round(attendanceRate * 10) / 10,
//         pendingRequests,
//       };
//     } catch (error) {
//       console.error('Error getting employee dashboard stats:', error);
//       return {
//         currentSalary: 0,
//         leaveBalance: 30,
//         attendanceRate: 0,
//         pendingRequests: 0,
//       };
//     }
//   }
// }
import { 
  User, Employee, Payroll, LeaveRequest, Attendance, Profile
} from "../shared/mongoose-schema.js";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";

export class DatabaseStorage {
  constructor() {
    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL is missing. Add MONGODB_URL to your environment variables.');
    }
    this.sessionStore = MongoStore.create({
      client: mongoose.connection.getClient(),
      touchAfter: 24 * 3600 // lazy session update
    });
  }

  // Users
  async getUser(id) {
    try {
      const user = await User.findById(id);
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username) {
    try {
      const user = await User.findOne({ username });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser) {
    try {
      const user = new User(insertUser);
      await user.save();
      return user.toObject();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserPassword(id, newPassword) {
    try {
      const user = await User.findByIdAndUpdate(
        id, 
        { password: newPassword }, 
        { new: true }
      );
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  // Employees
  async getEmployee(id) {
    try {
      const employee = await Employee.findById(id);
      return employee ? employee.toObject() : undefined;
    } catch (error) {
      console.error('Error getting employee:', error);
      return undefined;
    }
  }

  async getEmployeeByUserId(userId) {
    try {
      const employee = await Employee.findOne({ userId });
      return employee ? employee.toObject() : undefined;
    } catch (error) {
      console.error('Error getting employee by user ID:', error);
      return undefined;
    }
  }

  async getEmployeeByEmail(email) {
    try {
      const employee = await Employee.findOne({ email });
      return employee ? employee.toObject() : undefined;
    } catch (error) {
      console.error('Error getting employee by email:', error);
      return undefined;
    }
  }

  async getUserByEmail(email) {
    try {
      const employee = await Employee.findOne({ email });
      if (!employee) return undefined;
      const user = await User.findById(employee.userId);
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }
  

  

  async getAllEmployees() {
    try {
      const employees = await Employee.find().sort({ createdAt: -1 });
      return employees.map(emp => emp.toObject());
    } catch (error) {
      console.error('Error getting all employees:', error);
      return [];
    }
  }

  async createEmployee(insertEmployee) {
    try {
      const employee = new Employee(insertEmployee);
      await employee.save();
      return employee.toObject();
    } catch (error) {
  // console.error('Error creating employee:', error); // log removed
      throw error;
    }
  }

  async updateEmployee(id, updateEmployee) {
    try {
      const employee = await Employee.findByIdAndUpdate(
        id, 
        { ...updateEmployee, updatedAt: new Date() }, 
        { new: true }
      );
      return employee ? employee.toObject() : undefined;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  

  async deleteEmployee(id) {
    try {
      await Employee.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Payrolls
  async getPayroll(id) {
    try {
      const payroll = await Payroll.findById(id);
      return payroll ? payroll.toObject() : undefined;
    } catch (error) {
      console.error('Error getting payroll:', error);
      return undefined;
    }
  }

  async getPayrollsByEmployee(employeeId) {
    try {
      const payrolls = await Payroll.find({ employeeId }).sort({ createdAt: -1 });
      return payrolls.map(payroll => payroll.toObject());
    } catch (error) {
      console.error('Error getting payrolls by employee:', error);
      return [];
    }
  }

  async getAllPayrolls() {
    try {
      const payrolls = await Payroll.find().sort({ createdAt: -1 });
      return payrolls.map(payroll => payroll.toObject());
    } catch (error) {
      console.error('Error getting all payrolls:', error);
      return [];
    }
  }

  async createPayroll(insertPayroll) {
    try {
      const payroll = new Payroll(insertPayroll);
      await payroll.save();
      return payroll.toObject();
    } catch (error) {
      console.error('Error creating payroll:', error);
      throw error;
    }
  }

  async updatePayroll(id, updatePayroll) {
    try {
      const payroll = await Payroll.findByIdAndUpdate(
        id, 
        updatePayroll, 
        { new: true }
      );
      return payroll ? payroll.toObject() : undefined;
    } catch (error) {
      console.error('Error updating payroll:', error);
      throw error;
    }
  }

  async deletePayroll(id) {
    try {
      await Payroll.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting payroll:', error);
      throw error;
    }
  }

  // Leave Requests
  async getLeaveRequest(id) {
    try {
      const request = await LeaveRequest.findById(id);
      return request ? request.toObject() : undefined;
    } catch (error) {
      console.error('Error getting leave request:', error);
      return undefined;
    }
  }

  async getLeaveRequestsByEmployee(employeeId) {
    try {
      const requests = await LeaveRequest.find({ employeeId }).sort({ createdAt: -1 });
      return requests.map(req => req.toObject());
    } catch (error) {
      console.error('Error getting leave requests by employee:', error);
      return [];
    }
  }

  async getAllLeaveRequests() {
    try {
      const requests = await LeaveRequest.find().sort({ createdAt: -1 });
      return requests.map(req => req.toObject());
    } catch (error) {
      console.error('Error getting all leave requests:', error);
      return [];
    }
  }

  async createLeaveRequest(insertRequest) {
    try {
      const request = new LeaveRequest(insertRequest);
      await request.save();
      return request.toObject();
    } catch (error) {
      console.error('Error creating leave request:', error);
      throw error;
    }
  }

  async updateLeaveRequest(id, updateRequest) {
    try {
      const request = await LeaveRequest.findByIdAndUpdate(
        id, 
        updateRequest, 
        { new: true }
      );
      return request ? request.toObject() : undefined;
    } catch (error) {
      console.error('Error updating leave request:', error);
      throw error;
    }
  }

  async deleteLeaveRequest(id) {
    try {
      await LeaveRequest.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting leave request:', error);
      throw error;
    }
  }

  // Attendance
  async getAttendance(id) {
    try {
      const attendanceRecord = await Attendance.findById(id);
      return attendanceRecord ? attendanceRecord.toObject() : undefined;
    } catch (error) {
      console.error('Error getting attendance:', error);
      return undefined;
    }
  }

  async getAttendanceByEmployee(employeeId, startDate, endDate) {
    try {
      let query = { employeeId };
      
      if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      }
      
      const records = await Attendance.find(query).sort({ date: -1 });
      return records.map(record => record.toObject());
    } catch (error) {
      console.error('Error getting attendance by employee:', error);
      return [];
    }
  }

  async getAllAttendance() {
    try {
      const records = await Attendance.find().sort({ date: -1 });
      return records.map(record => record.toObject());
    } catch (error) {
      console.error('Error getting all attendance:', error);
      return [];
    }
  }

  async createAttendance(insertAttendance) {
    try {
      const record = new Attendance(insertAttendance);
      await record.save();
      return record.toObject();
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw error;
    }
  }

  async updateAttendance(id, updateAttendance) {
    try {
      const record = await Attendance.findByIdAndUpdate(
        id, 
        updateAttendance, 
        { new: true }
      );
      return record ? record.toObject() : undefined;
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  }

  async deleteAttendance(id) {
    try {
      await Attendance.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting attendance:', error);
      throw error;
    }
  }

  async getTodayAttendance(employeeId, today) {
    try {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const record = await Attendance.findOne({
        employeeId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });
      
      return record ? record.toObject() : null;
    } catch (error) {
      console.error('Error getting today attendance:', error);
      return null;
    }
  }

  // Dashboard Stats
  async getDashboardStats() {
    try {
      const [totalEmployees, totalPayroll, pendingLeaves, presentToday] = await Promise.all([
        Employee.countDocuments(),
        Payroll.aggregate([{ $group: { _id: null, total: { $sum: "$netSalary" } } }]),
        LeaveRequest.countDocuments({ status: 'pending' }),
        Attendance.countDocuments({ 
          status: 'present',
          date: { $gte: new Date(new Date().toDateString()) }
        })
      ]);

      return {
        totalEmployees: totalEmployees || 0,
        totalPayroll: totalPayroll[0]?.total || 0,
        pendingLeaves: pendingLeaves || 0,
        presentToday: presentToday || 0,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalEmployees: 0,
        totalPayroll: 0,
        pendingLeaves: 0,
        presentToday: 0,
      };
    }
  }

  async getEmployeeDashboardStats(employeeId) {
    try {
      const employee = await this.getEmployee(employeeId);
      const leaveRequests = await this.getLeaveRequestsByEmployee(employeeId);
      const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const attendanceRecords = await this.getAttendanceByEmployee(employeeId, currentMonth, new Date());
      
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
    } catch (error) {
      console.error('Error getting employee dashboard stats:', error);
      return {
        currentSalary: 0,
        leaveBalance: 30,
        attendanceRate: 0,
        pendingRequests: 0,
      };
    }
  }

  // Profile CRUD

  async getProfileByEmployeeId(employeeId) {
    try {
      const profile = await Profile.findOne({ employeeId });
      return profile ? profile.toObject() : undefined;
    } catch (error) {
      console.error('Error getting profile by employeeId:', error);
      return undefined;
    }
  }

  async createProfile(profileData) {
    try {
      const profile = new Profile(profileData);
      await profile.save();
      return profile.toObject();
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(employeeId, updateData) {
    try {
      const profile = await Profile.findOneAndUpdate(
        { employeeId },
        updateData,
        { new: true }
      );
      return profile ? profile.toObject() : undefined;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async deleteProfile(employeeId) {
    try {
      await Profile.findOneAndDelete({ employeeId });
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }
}