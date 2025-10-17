import { JitsiMeeting as JitsiMeetingSDK } from '@jitsi/react-sdk';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export default function JitsiMeeting({ roomName, meetingId, onMeetingEnd }) {
  const { user } = useAuth();

  useEffect(() => {
    if (meetingId && user) {
      apiRequest("PATCH", `/api/meetings/${meetingId}/join`).catch(err => {
        console.error('Failed to track attendance:', err);
      });
    }
  }, [meetingId, user]);

  return (
    <div className="h-screen w-screen">
      <JitsiMeetingSDK
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: true,
          disableModeratorIndicator: false,
          startScreenSharing: false,
          enableEmailInStats: false,
          prejoinPageEnabled: true,
          disableInviteFunctions: false,
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          SHOW_JITSI_WATERMARK: false,
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'chat',
            'recording',
            'livestreaming',
            'etherpad',
            'sharedvideo',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'feedback',
            'stats',
            'shortcuts',
            'tileview',
            'videobackgroundblur',
            'download',
            'help',
            'mute-everyone',
          ],
        }}
        userInfo={{
          displayName: user?.username || 'Guest',
          email: user?.email || ''
        }}
        onApiReady={(externalApi) => {
          console.log('Jitsi API ready');
          
          externalApi.addEventListeners({
            videoConferenceLeft: () => {
              console.log('User left the meeting');
              if (onMeetingEnd) {
                onMeetingEnd();
              }
            },
            participantJoined: (participant) => {
              console.log('Participant joined:', participant);
            },
          });
        }}
        getIFrameRef={(iframeRef) => {
          if (iframeRef) {
            iframeRef.style.height = '100vh';
            iframeRef.style.width = '100%';
          }
        }}
      />
    </div>
  );
}
