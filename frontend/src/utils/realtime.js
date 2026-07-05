import { io } from 'socket.io-client';

function resolveRealtimeUrl() {
  if (process.env.REACT_APP_WS_URL) return process.env.REACT_APP_WS_URL;
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  return window.location.origin;
}

export function createRealtimeClient(token) {
  if (!token) return null;

  return io(resolveRealtimeUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}