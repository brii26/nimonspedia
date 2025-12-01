import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'socket.io';
interface AuthenticatedSocket extends Socket {
    user?: {
        user_id: string;
        role: string;
        name: string;
    };
}
export default function registerAuctionHandlers(io: SocketIOServer, socket: AuthenticatedSocket): void;
export {};
//# sourceMappingURL=auctionSocket.d.ts.map