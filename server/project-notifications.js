import cron from 'node-cron';
import Project from './models/Project.js';
import { log } from './log.js';

let io = null;

export function initializeProjectNotifications(socketIO) {
  io = socketIO;
  log('[Project Notifications] Initialized');

  cron.schedule('*/30 * * * *', async () => {
    try {
      await checkProjectReminders();
      await autoArchiveCompletedProjects();
    } catch (error) {
      console.error('[Project Notifications] Cron error:', error);
    }
  });

  log('[Project Notifications] Scheduler started - checks every 30 minutes');
}

async function checkProjectReminders() {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const activeProjects = await Project.find({
      status: { $in: ['Scheduled', 'Active', 'In Progress'] }
    }).lean();

    for (const project of activeProjects) {
      for (const day of project.days) {
        if (day.status !== 'pending') continue;

        const dayDate = new Date(day.date);
        const dayStart = new Date(dayDate);
        dayStart.setHours(9, 0, 0, 0);

        if (dayStart >= now && dayStart <= oneHourLater) {
          log(`[Project Notifications] Sending reminder for project ${project.projectTitle}, day ${day.dayNumber}`);

          for (const assignee of day.assignees) {
            if (io) {
              io.to(`user_${assignee.userId}`).emit('task-reminder', {
                projectId: project._id,
                projectTitle: project.projectTitle,
                dayNumber: day.dayNumber,
                date: day.date,
                taskSummary: day.taskSummary,
                priority: project.priority,
                timeUntilStart: '1 hour'
              });
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('[Project Notifications] Check reminders error:', error);
  }
}

async function notifyProjectAssigned(projectId, assignedEmployees) {
  try {
    const project = await Project.findById(projectId).lean();
    if (!project || !io) return;

    assignedEmployees.forEach(emp => {
      io.to(`user_${emp.userId}`).emit('project-assigned', {
        projectId: project._id,
        projectTitle: project.projectTitle,
        startDate: project.startDate,
        daysCount: project.days.length,
        priority: project.priority
      });
    });

    log(`[Project Notifications] Notified ${assignedEmployees.length} employees about project assignment`);
  } catch (error) {
    console.error('[Project Notifications] Notify assigned error:', error);
  }
}

async function notifyDayStarted(projectId, dayNumber) {
  try {
    const project = await Project.findById(projectId).lean();
    if (!project || !io) return;

    const day = project.days.find(d => d.dayNumber === dayNumber);
    if (!day) return;

    day.assignees.forEach(assignee => {
      io.to(`user_${assignee.userId}`).emit('day-started', {
        projectId: project._id,
        projectTitle: project.projectTitle,
        dayNumber: day.dayNumber,
        taskSummary: day.taskSummary,
        expectedDeliverables: day.expectedDeliverables
      });
    });

    log(`[Project Notifications] Notified day ${dayNumber} started for project ${project.projectTitle}`);
  } catch (error) {
    console.error('[Project Notifications] Notify day started error:', error);
  }
}

async function autoArchiveCompletedProjects() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedProjects = await Project.find({
      status: 'Completed',
      updatedAt: { $lte: sevenDaysAgo }
    });

    for (const project of completedProjects) {
      project.status = 'Archived';
      await project.save();
      log(`[Project Notifications] Auto-archived project: ${project.projectTitle}`);
    }

    if (completedProjects.length > 0) {
      log(`[Project Notifications] Auto-archived ${completedProjects.length} completed projects`);
    }

  } catch (error) {
    console.error('[Project Notifications] Auto-archive error:', error);
  }
}

export {
  notifyProjectAssigned,
  notifyDayStarted
};
