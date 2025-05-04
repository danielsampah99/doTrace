import { Elysia } from 'elysia';
import { db } from '../db';
// import { users, userInteractions } from '../db/schema';
import { users } from '../db/schema/users';
import { eq } from 'drizzle-orm';

export const userRouter = new Elysia({ prefix: '/user' })
	.get('/:id', async ({ params }) => {
		const { id } = params;
		return db.query.users.findFirst({
			where: eq(users.id, Number(id)),
			with: {
				interactions: true,
			},
		});
	})
	.patch('/:id/preferences', async ({ params, body }) => {
		const { id } = params;
		const { preferences } = body as any;

		const [user] = await db
			.update(users)
			.set({ preferences })
			.where(eq(users.id, Number(id)))
			.returning();

		return user;
	})
	.patch('/:id/location-tracking', async ({ params, body }) => {
		const { id } = params;
		const { enabled } = body as any;

		const [user] = await db
			.update(users)
			.set({ locationTracking: enabled })
			.where(eq(users.id, Number(id)))
			.returning();

		return user;
	});
