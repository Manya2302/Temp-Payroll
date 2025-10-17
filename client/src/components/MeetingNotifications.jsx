import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Clock, Bell } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export default function MeetingNotifications() {
  const { socket } = useSocket();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('meeting-reminder', (data) => {
      console.log('Meeting reminder received:', data);
      
      toast({
        title: `Meeting in ${data.minutesUntil} minutes`,
        description: `"${data.title}" at ${data.time}`,
        duration: 5000,
      });

      if (data.minutesUntil === 60 || data.minutesUntil === 5) {
        setNotification({
          type: 'reminder',
          ...data
        });
      }
    });

    socket.on('meeting-started', (data) => {
      console.log('Meeting started notification:', data);
      
      setNotification({
        type: 'started',
        ...data
      });
    });

    return () => {
      socket.off('meeting-reminder');
      socket.off('meeting-started');
    };
  }, [socket, toast]);

  const handleJoinMeeting = () => {
    if (notification?.roomName) {
      setLocation(`/meetings/room/${notification.roomName}`);
      setNotification(null);
    }
  };

  const handleDismiss = () => {
    setNotification(null);
  };

  return (
    <Dialog open={!!notification} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {notification?.type === 'reminder' ? (
              <>
                <Bell className="h-5 w-5 text-blue-500" />
                Meeting Reminder
              </>
            ) : (
              <>
                <Video className="h-5 w-5 text-green-500" />
                Meeting Started
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {notification?.type === 'reminder' ? (
              <div className="space-y-2 pt-4">
                <p className="text-base font-medium text-gray-900">
                  {notification?.title}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  Starting in {notification?.minutesUntil} minutes at {notification?.time}
                </div>
                <p className="text-sm text-gray-500">
                  Get ready to join the meeting!
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-4">
                <p className="text-base font-medium text-gray-900">
                  {notification?.title}
                </p>
                <p className="text-sm text-gray-500">
                  The meeting has started. Join now!
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleDismiss}>
            Dismiss
          </Button>
          <Button onClick={handleJoinMeeting}>
            <Video className="h-4 w-4 mr-2" />
            Join Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
