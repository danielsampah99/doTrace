import { Elysia } from 'elysia';
import { recommendServices } from './recommendations-engine';

export const recommendationRouter = new Elysia({ prefix: '/recommendations' })
  .get('/', async ({ query }) => {
    const { userId, latitude, longitude, serviceType } = query as any;
    return recommendServices({
      userId: Number(userId),
      latitude: Number(latitude),
      longitude: Number(longitude),
      serviceType,
    });
  });
