import express from 'express';
import mongoose from 'mongoose';
import { User, Employee } from '../../shared/mongoose-schema.js';
import Project from '../models/Project.js';

const router = express.Router();

router.post('/api/admin/fix-user-ids', async (req, res) => {
  try {
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
            { $set: { 'assignedEmployees.$.userId': new mongoose.Types.ObjectId(correctId) } }
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
              { $set: { [`days.${dayIdx}.assignees.${assigneeIdx}.userId`]: new mongoose.Types.ObjectId(correctId) } }
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

export default router;
