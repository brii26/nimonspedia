interface User {
    user_id: string;
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'USER' | 'SELLER';
    created_at: Date;
    balance?: number;
}
interface FindAllParams {
    limit: number;
    offset: number;
    search: string;
    role: string;
}
interface UserWithStore extends User {
    store_name?: string;
    feature_flags?: Array<{
        feature_name: string;
        is_enabled: boolean;
        reason?: string;
    }>;
}
declare class UserRepository {
    findByEmail(email: string): Promise<User | undefined>;
    findByEmailAndRole(email: string, role: string): Promise<User | undefined>;
    findAll({ limit, offset, search, role }: FindAllParams): Promise<{
        users: UserWithStore[];
        total: number;
    }>;
    countTotal(): Promise<number>;
    seedAdminUser(): Promise<any>;
    deleteUserById(userId: string): Promise<boolean>;
    getDashboardStats(): Promise<{
        totalUsers: number;
        totalBuyers: number;
        totalSellers: number;
        activeAuctions: number;
    }>;
}
declare const _default: UserRepository;
export default _default;
//# sourceMappingURL=userRepository.d.ts.map