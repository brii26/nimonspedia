import { FastifyRequest, FastifyReply } from 'fastify';
import featureFlagRepository from '../repositories/featureFlagRepository.js';

interface FeatureFlagOptions {
  featureName: string;
  checkUser?: boolean;
}

export const checkFeatureFlag = (options: FeatureFlagOptions) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const { featureName, checkUser } = options;

    try {
      // 1. Cek Global Flag
      const globalFlag = await featureFlagRepository.getGlobalFlag(featureName);

      // Global flag harus ada dan enabled
      if (!globalFlag || !globalFlag.is_enabled) {
        return reply.status(503).send({
          success: false,
          message: `Feature '${featureName}' is currently under maintenance.`
        });
      }

      // 2. Cek User Flag
      if (checkUser && (req as any).user) {
        const userId = (req as any).user.user_id;
        const userFlag = await featureFlagRepository.getUserFlag(userId, featureName);

        // Hanya block jika user flag ADA dan DISABLED
        if (userFlag && !userFlag.is_enabled) {
          return reply.status(503).send({
            success: false,
            message: `Feature '${featureName}' is currently not available to ${(req as any).user.name}. ${userFlag.reason ? `Reason: ${userFlag.reason}` : ''}`
          });
        }
      }

    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ message: 'Error checking feature flags' });
    }
  };
};