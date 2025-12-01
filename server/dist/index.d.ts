import 'dotenv/config';
import { Server as SocketIOServer } from 'socket.io';
declare module 'fastify' {
    interface FastifyInstance {
        io: SocketIOServer;
    }
}
//# sourceMappingURL=index.d.ts.map