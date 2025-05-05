import { Elysia } from 'elysia';


export const recommendationRouter = new Elysia({
	prefix: '/recommendations',
}).get('/', async ({ query }) => {
	const { userId, latitude, longitude, serviceType } = query as any;
	return {
		userId: Number(userId),
		latitude: Number(latitude),
		longitude: Number(longitude),
		serviceType,
	};
});
