import { createClient } from 'redis';
import 'dotenv/config';
const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || '6379'}`
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis for Session'));
(async () => {
    await redisClient.connect();
})();
export default redisClient;
//# sourceMappingURL=redis.js.map