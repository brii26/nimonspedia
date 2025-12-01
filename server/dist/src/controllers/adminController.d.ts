import { FastifyRequest, FastifyReply } from 'fastify';
interface LoginBody {
    email: string;
    password: string;
}
interface AdminUser {
    user_id: string;
    role: string;
    name: string;
}
interface UserFlagBody {
    user_id: string;
    feature_name: string;
    is_enabled: boolean;
    reason: string;
}
interface GlobalFlagBody {
    feature_name: string;
    is_enabled: boolean;
    reason: string;
}
interface QueryParams {
    page?: string;
    limit?: string;
    search?: string;
    role?: string;
}
declare module 'fastify' {
    interface FastifyRequest {
        user?: AdminUser;
    }
}
export declare const login: (request: FastifyRequest<{
    Body: LoginBody;
}>, reply: FastifyReply) => Promise<never>;
export declare const getUsers: (request: FastifyRequest<{
    Querystring: QueryParams;
}>, reply: FastifyReply) => Promise<never>;
export declare const updateUserFlag: (request: FastifyRequest<{
    Body: UserFlagBody;
}>, reply: FastifyReply) => Promise<never>;
export declare const updateGlobalFlag: (request: FastifyRequest<{
    Body: GlobalFlagBody;
}>, reply: FastifyReply) => Promise<never>;
export declare const getGlobalFlags: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
export declare const getStats: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
declare const _default: {
    login: (request: FastifyRequest<{
        Body: LoginBody;
    }>, reply: FastifyReply) => Promise<never>;
    getUsers: (request: FastifyRequest<{
        Querystring: QueryParams;
    }>, reply: FastifyReply) => Promise<never>;
    updateUserFlag: (request: FastifyRequest<{
        Body: UserFlagBody;
    }>, reply: FastifyReply) => Promise<never>;
    updateGlobalFlag: (request: FastifyRequest<{
        Body: GlobalFlagBody;
    }>, reply: FastifyReply) => Promise<never>;
    getGlobalFlags: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
    getStats: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
};
export default _default;
//# sourceMappingURL=adminController.d.ts.map