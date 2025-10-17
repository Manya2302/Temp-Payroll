import mongoose from 'mongoose';
import { User, Employee } from '../shared/mongoose-schema.js';
import Project from './models/Project.js';
import { log } from './log.js';

export async function fixUserIdMismatches() {
  try {
    log('=== Checking for User ID Mismatches ===');
    
    // Get all users
    const users = await User.find({}).lean();
    log(`Found ${users.length} users in database`);
    
    // Get all employees with their user references
    const employees = await Employee.find({}).populate('userId').lean();
    const employeeMap = {};
    
    for (const emp of employees) {
      if (emp.userId) {
        const fullName = `${emp.firstName} ${emp.lastName}`;
        employeeMap[fullName] = emp.userId._id.toString();
        employeeMap[fullName.toLowerCase()] = emp.userId._id.toString();
        employeeMap[emp.firstName] = emp.userId._id.toString();
        employeeMap[emp.firstName.toLowerCase()] = emp.userId._id.toString();
      }
    }
    
    // Get all projects
    const projects = await Project.find({}).lean();
    
    let fixCount = 0;
    
    for (const project of projects) {
      // Check assignedEmployees
      for (let i = 0; i < project.assignedEmployees.length; i++) {
        const emp = project.assignedEmployees[i];
        const correctId = employeeMap[emp.name] || employeeMap[emp.name.toLowerCase()];
        
        if (correctId && emp.userId.toString() !== correctId) {
          log(`Fixing ${emp.name}'s userId in project "${project.projectTitle}"`);
          log(`  Old: ${emp.userId.toString()}, New: ${correctId}`);
          
          await Project.updateOne(
            { _id: project._id, 'assignedEmployees._id': emp._id },
            { $set: { 'assignedEmployees.$.userId': new mongoose.Types.ObjectId(correctId) } }
          );
          
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
            await Project.updateOne(
              { _id: project._id },
              { $set: { [`days.${dayIdx}.assignees.${assigneeIdx}.userId`]: new mongoose.Types.ObjectId(correctId) } }
            );
            
            fixCount++;
          }
        }
      }
    }
    
    if (fixCount > 0) {
      log(`✓ Fixed ${fixCount} user ID mismatches`);
    } else {
      log('✓ No user ID mismatches found');
    }
    
  } catch (error) {
    console.error('Error fixing user ID mismatches:', error);
  }
}
