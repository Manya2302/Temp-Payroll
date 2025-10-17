import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './use-auth';

let socket = null;

export function useSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (!socket) {
      socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('Socket.IO connected');
        setIsConnected(true);
        socket.emit('join-room', user.id);
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        setIsConnected(false);
      });
    }

    return () => {
      if (socket && !user) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [user]);

  return { socket, isConnected };
}

export function getSocket() {
  return socket;
}
