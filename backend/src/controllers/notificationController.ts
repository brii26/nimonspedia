import { FastifyRequest, FastifyReply } from 'fastify';
import notificationService from '../services/notificationService.js';
import { PushSubscriptionData } from '../repositories/notificationRepository.js';

interface SubscribeBody {
  subscription: PushSubscriptionData;
}

interface PreferencesBody {
  chat_enabled?: boolean;
  auction_enabled?: boolean;
  order_enabled?: boolean;
}

export const getVapidPublicKey = async (
  request: FastifyRequest, 
  reply: FastifyReply
) => {
  try {
    const key = notificationService.getPublicKey();
    return reply.send({ success: true, publicKey: key });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, message: 'Server configuration error' });
  }
};

export const subscribe = async (
  request: FastifyRequest<{ Body: SubscribeBody }>, 
  reply: FastifyReply
) => {
  const user = request.user;
  const { subscription } = request.body;

  if (!user) {
    return reply.status(401).send({ success: false, message: 'Unauthorized' });
  }

  if (!subscription || !subscription.endpoint) {
    return reply.status(400).send({ success: false, message: 'Invalid subscription data' });
  }

  try {
    await notificationService.subscribe(Number(user.user_id), subscription);
    return reply.send({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, message: 'Failed to subscribe' });
  }
};

export const getPreferences = async (
  request: FastifyRequest, 
  reply: FastifyReply
) => {
  const user = request.user;
  if (!user) return reply.status(401).send({ success: false, message: 'Unauthorized' });

  try {
    const prefs = await notificationService.getPreferences(Number(user.user_id));
    return reply.send({ success: true, data: prefs });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, message: 'Failed to fetch preferences' });
  }
};

export const updatePreferences = async (
  request: FastifyRequest<{ Body: PreferencesBody }>, 
  reply: FastifyReply
) => {
  const user = request.user;
  if (!user) return reply.status(401).send({ success: false, message: 'Unauthorized' });

  try {
    const updated = await notificationService.updatePreferences(Number(user.user_id), request.body);
    return reply.send({ success: true, data: updated, message: 'Preferences updated' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, message: 'Failed to update preferences' });
  }
};

export default {
  getVapidPublicKey,
  subscribe,
  getPreferences,
  updatePreferences
};