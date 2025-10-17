import { useParams, useLocation } from 'wouter';
import JitsiMeeting from '@/components/JitsiMeeting';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function MeetingRoom() {
  const { roomName } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: meetings } = useQuery({
    queryKey: ["/api/meetings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/meetings");
      return res.json();
    },
  });

  const meeting = meetings?.find(m => m.roomName === roomName);

  const handleMeetingEnd = () => {
    if (user?.role === 'admin') {
      setLocation('/admin/meetings');
    } else {
      setLocation('/meetings');
    }
  };

  if (!user) {
    setLocation('/login');
    return null;
  }

  return (
    <JitsiMeeting
      roomName={roomName}
      meetingId={meeting?._id}
      onMeetingEnd={handleMeetingEnd}
    />
  );
}
