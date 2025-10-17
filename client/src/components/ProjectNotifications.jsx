import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertCircle, CheckCircle2, Briefcase } from 'lucide-react';
import { useLocation } from 'wouter';

export default function ProjectNotifications() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [taskReminder, setTaskReminder] = useState(null);
  const [projectAssigned, setProjectAssigned] = useState(null);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on('task-reminder', (data) => {
      console.log('Task reminder received:', data);
      setTaskReminder(data);
      
      toast({
        title: '⏰ Task Starting Soon!',
        description: `${data.projectTitle} - Day ${data.dayNumber} starts in ${data.timeUntilStart}`,
        duration: 5000
      });
    });

    socket.on('project-assigned', (data) => {
      console.log('Project assigned:', data);
      setProjectAssigned(data);
      
      toast({
        title: '📋 New Project Assigned!',
        description: `You've been assigned to: ${data.projectTitle}`,
        duration: 5000
      });
    });

    socket.on('day-started', (data) => {
      console.log('Day started:', data);
      
      toast({
        title: '🚀 Task Day Started!',
        description: `Day ${data.dayNumber} of ${data.projectTitle} has begun`,
        duration: 5000
      });
    });

    return () => {
      socket.off('task-reminder');
      socket.off('project-assigned');
      socket.off('day-started');
    };
  }, [socket, user]);

  const handleViewTask = () => {
    if (taskReminder) {
      setLocation('/employee/tasks');
      setTaskReminder(null);
    }
  };

  const handleViewProject = () => {
    if (projectAssigned) {
      setLocation('/employee/tasks');
      setProjectAssigned(null);
    }
  };

  return (
    <>
      <Dialog open={!!taskReminder} onOpenChange={(open) => !open && setTaskReminder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Task Reminder
            </DialogTitle>
            <DialogDescription>
              Your task is starting soon
            </DialogDescription>
          </DialogHeader>
          {taskReminder && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{taskReminder.projectTitle}</h3>
                <p className="text-sm text-muted-foreground mb-3">Day {taskReminder.dayNumber}</p>
                <p className="text-sm mb-3">{taskReminder.taskSummary}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(taskReminder.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Starts in {taskReminder.timeUntilStart}</span>
                  </div>
                  {taskReminder.priority && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">{taskReminder.priority} Priority</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleViewTask} className="flex-1">
                  <Briefcase className="mr-2 h-4 w-4" />
                  View My Tasks
                </Button>
                <Button variant="outline" onClick={() => setTaskReminder(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!projectAssigned} onOpenChange={(open) => !open && setProjectAssigned(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              New Project Assigned
            </DialogTitle>
            <DialogDescription>
              You have been assigned to a new project
            </DialogDescription>
          </DialogHeader>
          {projectAssigned && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{projectAssigned.projectTitle}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Starts: {new Date(projectAssigned.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{projectAssigned.daysCount} days</span>
                  </div>
                  {projectAssigned.priority && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">{projectAssigned.priority} Priority</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleViewProject} className="flex-1">
                  <Briefcase className="mr-2 h-4 w-4" />
                  View My Tasks
                </Button>
                <Button variant="outline" onClick={() => setProjectAssigned(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
