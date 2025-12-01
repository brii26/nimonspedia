import { FastifyRequest, FastifyReply } from 'fastify';
import featureFlagRepository from '../repositories/featureFlagRepository';

interface FeatureFlagOptions {
  featureName: string;
  checkUser?: boolean;
}

export const checkFeatureFlag = (options: FeatureFlagOptions) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const { featureName, checkUser } = options;

    try {
      // 1. Cek Global Flag
      const globalFlags = await featureFlagRepository.getGlobalFlag(featureName);

      // Jika tidak ditemukan, defaultnya bisa TRUE atau FALSE (tergantung kebijakan, disini default FALSE aman)
      if (!globalFlags) {
        return reply.status(503).send({
          success: false,
          message: `Feature '${featureName}' is currently under maintenance.`
        });
      }

      // 2. Cek User Flag
      if (checkUser && (req as any).user) {
        const userId = (req as any).user.user_id;
        const userFlag = await featureFlagRepository.getUserFlag(userId, featureName);

        if (!userFlag) {
            return reply.status(503).send({
            success: false,
            message: `Feature '${featureName}' is currently not available to ${(req as any).user.name}.`
            });
        }
      }

    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ message: 'Error checking feature flags' });
    }
  };
};