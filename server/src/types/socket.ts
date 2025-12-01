import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  user: {
    user_id: number;
    name: string;
    role: string;
  };
}