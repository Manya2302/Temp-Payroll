import { Meeting } from '../shared/mongoose-schema.js';
import { log } from './log.js';

let io = null;

export function initializeMeetingNotifications(socketIo) {
  io = socketIo;
  
  setInterval(checkMeetingReminders, 60000);
  
  log('Meeting notification service initialized');
}

async function checkMeetingReminders() {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    const upcomingMeetings = await Meeting.find({
      status: 'scheduled',
      date: {
        $gte: now,
        $lte: oneHourLater
      }
    });
    
    for (const meeting of upcomingMeetings) {
      const meetingTime = new Date(`${meeting.date.toDateString()} ${meeting.time}`);
      const timeDiff = meetingTime - now;
      
      if (timeDiff > 0 && timeDiff <= 3600000) {
        const minutesUntil = Math.floor(timeDiff / 60000);
        
        if (minutesUntil === 60 || minutesUntil === 30 || minutesUntil === 15 || minutesUntil === 5) {
          if (io) {
            io.emit('meeting-reminder', {
              meetingId: meeting.id,
              title: meeting.title,
              time: meeting.time,
              minutesUntil,
              roomName: meeting.roomName
            });
            
            log(`Sent meeting reminder: ${meeting.title} (${minutesUntil} minutes)`);
          }
        }
      }
      
      if (timeDiff <= 60000 && timeDiff >= -60000) {
        if (io) {
          io.emit('meeting-started', {
            meetingId: meeting.id,
            title: meeting.title,
            time: meeting.time,
            roomName: meeting.roomName
          });
          
          log(`Meeting started notification: ${meeting.title}`);
        }
      }
    }
    
    const ongoingMeetings = await Meeting.find({
      status: 'ongoing'
    });
    
    for (const meeting of ongoingMeetings) {
      const meetingTime = new Date(`${meeting.date.toDateString()} ${meeting.time}`);
      const endTime = new Date(meetingTime.getTime() + 2 * 60 * 60 * 1000);
      
      if (now > endTime) {
        meeting.status = 'completed';
        meeting.completedAt = now;
        await meeting.save();
        
        log(`Auto-completed meeting: ${meeting.title}`);
      }
    }
  } catch (error) {
    console.error('Error checking meeting reminders:', error);
  }
}
