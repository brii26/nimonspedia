import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'socket.io';
interface AuthenticatedSocket extends Socket {
    user?: {
        user_id: string;
        role: string;
        name: string;
    };
}
export default function registerChatHandlers(io: SocketIOServer, socket: AuthenticatedSocket): void;
export {};
//# sourceMappingURL=chatSocket.d.ts.map