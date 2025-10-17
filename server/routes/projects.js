import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import { User } from '../../shared/mongoose-schema.js';
import { generateProjectTaskDistribution, refineProjectPlan } from '../services/gemini.js';
import { sendProjectAssignmentEmail } from '../email.js';

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

function requireAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
}

router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      projectTitle,
      description,
      assignedEmployees,
      startDate,
      endDate,
      preferredEndDate,
      priority,
      estimatedEffort,
      distributionSettings,
      clientNotes,
      notes
    } = req.body;

    if (!projectTitle || !description || !assignedEmployees || assignedEmployees.length === 0 || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('[Projects] Generating task distribution with Gemini...');
    
    let geminiResult;
    let usedFallback = false;
    
    try {
      geminiResult = await generateProjectTaskDistribution({
        projectTitle,
        description,
        assignedEmployees,
        startDate,
        endDate: endDate || preferredEndDate,
        estimatedEffort,
        distributionStrategy: distributionSettings?.strategy || 'even-load',
        clientNotes
      });
    } catch (geminiError) {
      console.warn('[Projects] Gemini unavailable, using fallback distribution:', geminiError.message);
      usedFallback = true;
      
      let maxDays = estimatedEffort?.value || 5;
      if (estimatedEffort?.unit === 'hours') {
        maxDays = Math.ceil(estimatedEffort.value / 8);
      }
      if (endDate && startDate) {
        const daysDiff = Math.ceil((new Date(endDate || preferredEndDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        if (daysDiff > 0 && daysDiff < maxDays) {
          maxDays = daysDiff;
        }
      }
      
      geminiResult = {
        days: Array.from({ length: maxDays }, (_, i) => ({
          dayNumber: i + 1,
          taskSummary: `Day ${i + 1} tasks for ${projectTitle}`,
          subtasks: [
            `Review project requirements and objectives`,
            `Work on assigned tasks`,
            `Document progress and findings`,
            `Prepare deliverables for review`
          ],
          expectedDeliverables: [`Day ${i + 1} deliverables`],
          estimatedHours: 6,
          assigneeIndices: assignedEmployees.map((_, idx) => idx)
        })),
        prompt: 'Fallback: Gemini AI was unavailable',
        rawResponse: 'Generated using fallback distribution due to AI service unavailability'
      };
    }

    const days = geminiResult.days.map((day, index) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + index);

      let assignees = [];
      if (day.assigneeIndices && Array.isArray(day.assigneeIndices)) {
        assignees = day.assigneeIndices.map(idx => {
          const emp = assignedEmployees[idx];
          if (!emp) return null;
          
          if (distributionSettings?.strategy === 'even-load' && day.assigneeIndices.length > 1) {
            const tasksPerEmployee = Math.ceil(day.subtasks.length / day.assigneeIndices.length);
            const startIdx = idx * tasksPerEmployee;
            const empSubtasks = day.subtasks.slice(startIdx, startIdx + tasksPerEmployee).map(st => ({
              title: st,
              description: '',
              completed: false
            }));

            return {
              userId: emp.userId,
              name: emp.name,
              subtasks: empSubtasks
            };
          } else {
            return {
              userId: emp.userId,
              name: emp.name,
              subtasks: day.subtasks.map(st => ({
                title: st,
                description: '',
                completed: false
              }))
            };
          }
        }).filter(a => a !== null);
      } else {
        assignees = assignedEmployees.map(emp => ({
          userId: emp.userId,
          name: emp.name,
          subtasks: day.subtasks ? day.subtasks.map(st => ({
            title: st,
            description: '',
            completed: false
          })) : []
        }));
      }

      return {
        dayNumber: day.dayNumber || (index + 1),
        date: dayDate,
        assignees,
        taskSummary: day.taskSummary,
        subtasks: day.subtasks || [],
        expectedDeliverables: day.expectedDeliverables || [],
        estimatedHours: day.estimatedHours || 6,
        status: 'pending',
        comments: [],
        attachments: []
      };
    });

    const project = new Project({
      projectTitle,
      description,
      assignedEmployees: assignedEmployees.map(emp => ({
        userId: emp.userId,
        name: emp.name,
        role: emp.role || ''
      })),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      preferredEndDate: preferredEndDate ? new Date(preferredEndDate) : null,
      priority: priority || 'Medium',
      estimatedEffort,
      status: 'Scheduled',
      days,
      distributionSettings: distributionSettings || { strategy: 'even-load' },
      clientNotes,
      notes,
      createdBy: req.user._id,
      audit: [{
        action: 'created',
        performedBy: req.user._id,
        performedByName: req.user.name,
        timestamp: new Date(),
        details: `Project created with ${days.length} days${usedFallback ? ' (AI unavailable - basic distribution used)' : ' (AI-powered distribution)'}`,
        geminiPrompt: geminiResult.prompt,
        geminiResponse: geminiResult.rawResponse,
        usedFallback
      }]
    });

    await project.save();

    const io = req.app.get('io');
    const storage = req.app.get('storage');
    
    if (io) {
      project.assignedEmployees.forEach(emp => {
        io.to(`user_${emp.userId}`).emit('project-assigned', {
          projectId: project._id,
          projectTitle: project.projectTitle,
          startDate: project.startDate,
          daysCount: project.days.length,
          priority: project.priority
        });
      });
    }

    for (const emp of project.assignedEmployees) {
      try {
        const employee = await User.findById(emp.userId).select('email name').lean();
        if (employee && employee.email) {
          await sendProjectAssignmentEmail(
            employee.email,
            emp.name || employee.name,
            project.projectTitle,
            project.description,
            project.startDate,
            project.days.length,
            project.priority
          );
          console.log(`[Projects] Email sent to ${employee.email}`);
        }
      } catch (emailError) {
        console.error('[Projects] Email error:', emailError);
      }
    }

    console.log('[Projects] Project created:', project._id);
    res.status(201).json(project);

  } catch (error) {
    console.error('[Projects] Create error:', error);
    res.status(500).json({ message: error.message || 'Failed to create project' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, priority, assigned } = req.query;
    const isAdmin = req.user.role === 'admin';

    let query = {};

    if (!isAdmin) {
      const userObjectId = new mongoose.Types.ObjectId(req.user._id);
      query['assignedEmployees.userId'] = userObjectId;
    } else if (assigned === 'true') {
      query.createdBy = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean();

    res.json(projects);

  } catch (error) {
    console.error('[Projects] List error:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isAssigned = project.assignedEmployees.some(emp => {
      const empUserId = emp.userId?._id || emp.userId;
      return empUserId?.toString() === req.user._id.toString();
    });

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);

  } catch (error) {
    console.error('[Projects] Get error:', error);
    res.status(500).json({ message: 'Failed to fetch project' });
  }
});

router.patch('/:id/days/:dayNumber/complete', requireAuth, async (req, res) => {
  try {
    const { id, dayNumber } = req.params;
    const { comments, subtaskIndex } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const day = project.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    const assignee = day.assignees.find(a => a.userId.toString() === req.user._id.toString());
    if (!assignee && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not assigned to this day' });
    }

    if (assignee && subtaskIndex !== undefined) {
      if (assignee.subtasks[subtaskIndex]) {
        assignee.subtasks[subtaskIndex].completed = true;
        assignee.subtasks[subtaskIndex].completedAt = new Date();
      }

      const allSubtasksComplete = day.assignees.every(a => 
        a.subtasks.every(st => st.completed)
      );

      if (allSubtasksComplete) {
        day.status = 'completed';
        day.completedAt = new Date();
      } else if (!day.status || day.status === 'pending') {
        day.status = 'in_progress';
      }
    } else {
      day.status = 'completed';
      day.completedBy = req.user._id;
      day.completedAt = new Date();
    }

    if (comments) {
      day.comments.push({
        userId: req.user._id,
        userName: req.user.name,
        text: comments,
        createdAt: new Date()
      });
    }

    project.calculateProgress();
    project.updateStatus();

    project.audit.push({
      action: 'day_completed',
      performedBy: req.user._id,
      performedByName: req.user.name,
      timestamp: new Date(),
      details: `Day ${dayNumber} ${subtaskIndex !== undefined ? 'subtask completed' : 'marked complete'}`
    });

    await project.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`project_${id}`).emit('day-completed', {
        projectId: id,
        dayNumber,
        status: day.status,
        progress: project.progress
      });
    }

    res.json(project);

  } catch (error) {
    console.error('[Projects] Complete day error:', error);
    res.status(500).json({ message: 'Failed to complete day' });
  }
});

router.patch('/:id/days/:dayNumber/status', requireAuth, async (req, res) => {
  try {
    const { id, dayNumber } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed', 'completed_pending_approval', 'approved', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const day = project.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    day.status = status;
    
    project.calculateProgress();
    project.updateStatus();

    project.audit.push({
      action: 'status_changed',
      performedBy: req.user._id,
      performedByName: req.user.name,
      timestamp: new Date(),
      details: `Day ${dayNumber} status changed to ${status}`
    });

    await project.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`project_${id}`).emit('day-status-changed', {
        projectId: id,
        dayNumber,
        status,
        progress: project.progress
      });
    }

    res.json(project);

  } catch (error) {
    console.error('[Projects] Update day status error:', error);
    res.status(500).json({ message: 'Failed to update day status' });
  }
});

router.patch('/:id/assign', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedEmployees, distributionSettings } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (assignedEmployees) {
      project.assignedEmployees = assignedEmployees.map(emp => ({
        userId: emp.userId,
        name: emp.name,
        role: emp.role || ''
      }));
    }

    if (distributionSettings) {
      project.distributionSettings = distributionSettings;
    }

    project.audit.push({
      action: 'reassigned',
      performedBy: req.user._id,
      performedByName: req.user.name,
      timestamp: new Date(),
      details: `Project reassigned to ${assignedEmployees.length} employees`
    });

    await project.save();

    const io = req.app.get('io');
    if (io) {
      project.assignedEmployees.forEach(emp => {
        io.to(`user_${emp.userId}`).emit('project-reassigned', {
          projectId: project._id,
          projectTitle: project.projectTitle
        });
      });
    }

    res.json(project);

  } catch (error) {
    console.error('[Projects] Reassign error:', error);
    res.status(500).json({ message: 'Failed to reassign project' });
  }
});

router.post('/:id/refine', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { refinementInstructions } = req.body;

    if (!refinementInstructions) {
      return res.status(400).json({ message: 'Refinement instructions required' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const currentPlan = { days: project.days };
    
    console.log('[Projects] Refining plan with Gemini...');
    const refinedResult = await refineProjectPlan(id, currentPlan, refinementInstructions);

    project.days = refinedResult.days.map((day, index) => ({
      ...project.days[index],
      taskSummary: day.taskSummary || project.days[index].taskSummary,
      subtasks: day.subtasks || project.days[index].subtasks,
      expectedDeliverables: day.expectedDeliverables || project.days[index].expectedDeliverables,
      estimatedHours: day.estimatedHours || project.days[index].estimatedHours
    }));

    project.audit.push({
      action: 'gemini_generated',
      performedBy: req.user._id,
      performedByName: req.user.name,
      timestamp: new Date(),
      details: 'Plan refined using Gemini AI',
      geminiPrompt: refinementInstructions,
      geminiResponse: refinedResult.rawResponse
    });

    await project.save();

    res.json(project);

  } catch (error) {
    console.error('[Projects] Refine error:', error);
    res.status(500).json({ message: error.message || 'Failed to refine project' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Project.deleteOne({ _id: id });

    res.json({ message: 'Project deleted successfully' });

  } catch (error) {
    console.error('[Projects] Delete error:', error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

router.get('/user/:userId/tasks', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;

    console.log('[Projects] Fetching tasks for userId:', userObjectId.toString());

    const projects = await Project.find({
      'assignedEmployees.userId': userObjectId,
      status: { $in: ['Scheduled', 'Active', 'In Progress'] }
    }).lean();

    console.log('[Projects] Found projects count:', projects.length);
    if (projects.length > 0) {
      console.log('[Projects] First project assignedEmployees:', JSON.stringify(projects[0].assignedEmployees, null, 2));
    }

    const tasks = [];

    projects.forEach(project => {
      project.days.forEach(day => {
        const assignee = day.assignees.find(a => a.userId.toString() === userObjectId.toString());
        if (assignee) {
          tasks.push({
            projectId: project._id,
            projectTitle: project.projectTitle,
            priority: project.priority,
            dayNumber: day.dayNumber,
            date: day.date,
            taskSummary: day.taskSummary,
            subtasks: assignee.subtasks,
            expectedDeliverables: day.expectedDeliverables,
            estimatedHours: day.estimatedHours,
            status: day.status
          });
        }
      });
    });

    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(tasks);

  } catch (error) {
    console.error('[Projects] User tasks error:', error);
    res.status(500).json({ message: 'Failed to fetch user tasks' });
  }
});

export default router;
