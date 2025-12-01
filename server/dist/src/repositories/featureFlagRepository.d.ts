import { QueryResult } from 'pg';
declare class FeatureFlagRepository {
    upsertUserFlag(userId: string, featureName: string, isEnabled: boolean, reason: string): Promise<QueryResult>;
    upsertGlobalFlag(featureName: string, isEnabled: boolean, reason: string): Promise<QueryResult>;
    getGlobalFlags(): Promise<any[]>;
}
declare const _default: FeatureFlagRepository;
export default _default;
//# sourceMappingURL=featureFlagRepository.d.ts.map