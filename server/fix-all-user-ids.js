import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Employee } from '../shared/mongoose-schema.js';
import Project from './models/Project.js';

// Load environment variables
dotenv.config();

const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/loco_payroll';

async function fixUserIds() {
  await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB\n');
  
  try {
    // Get all users with their IDs
    const users = await User.find({}).lean();
    console.log('Found users in User collection:');
    users.forEach(user => {
      console.log(`  ${user.username}: _id = ${user._id.toString()}`);
    });
    
    // Get all employees with their user references
    const employees = await Employee.find({}).populate('user').lean();
    console.log('\nFound employees in Employee collection:');
    const employeeMap = {};
    employees.forEach(emp => {
      if (emp.user) {
        console.log(`  ${emp.name}: userId = ${emp.user._id.toString()}, username = ${emp.user.username}`);
        employeeMap[emp.name] = emp.user._id.toString();
        employeeMap[emp.name.toLowerCase()] = emp.user._id.toString();
      }
    });
    
    console.log('\n=== Checking all projects for userId mismatches ===\n');
    
    // Get all projects
    const projects = await Project.find({}).lean();
    
    let fixCount = 0;
    let projectsFixed = 0;
    
    for (const project of projects) {
      let projectUpdated = false;
      
      // Fix assignedEmployees
      for (let i = 0; i < project.assignedEmployees.length; i++) {
        const emp = project.assignedEmployees[i];
        const correctId = employeeMap[emp.name] || employeeMap[emp.name.toLowerCase()];
        
        if (correctId && emp.userId.toString() !== correctId) {
          console.log(`Project "${project.projectTitle}": Fixing ${emp.name}'s userId in assignedEmployees`);
          console.log(`  Old: ${emp.userId.toString()}`);
          console.log(`  New: ${correctId}`);
          
          await Project.updateOne(
            { _id: project._id, 'assignedEmployees._id': emp._id },
            { $set: { 'assignedEmployees.$.userId': new mongoose.Types.ObjectId(correctId) } }
          );
          
          projectUpdated = true;
          fixCount++;
        }
      }
      
      // Fix days assignees
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
              { $set: { [`days.${dayIdx}.assignees.${assigneeIdx}.userId`]: new mongoose.Types.ObjectId(correctId) } }
            );
            
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
    
    console.log(`\n=== Fix Summary ===`);
    console.log(`Total userId fixes applied: ${fixCount}`);
    console.log(`Total projects updated: ${projectsFixed}`);
    console.log('All userId mismatches have been fixed!');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

fixUserIds()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
