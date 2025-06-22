// import { businesses, businessSubscriptions } from '../db/schema';
import { and, eq, gte } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '../db';
import { businessSubscriptions } from '../db/schema/business-subsriptions';
import { businesses } from '../db/schema/businesses';

export const businessRouter = new Elysia({ prefix: '/business' })
	.post('/register', async ({ body }) => {
		const { name, type, address, latitude, longitude, contactNumber } =
			body as any;
		const [business] = await db
			.insert(businesses)
			.values({
				name,
				type,
				address,
				latitude,
				longitude,
				contactNumber,
			})
			.returning();
		return business;
	})
	.post('/:id/subscribe', async ({ params, body }) => {
		const { id } = params;
		const { tier, paymentDetails } = body as any;

		const [subscription] = await db
			.insert(businessSubscriptions)
			.values({
				businessId: Number(id),
				tier,
				paymentDetails,
				endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
			})
			.returning();

		// Update business premium status
		await db
			.update(businesses)
			.set({ isPremium: true, premiumTier: tier })
			.where(eq(businesses.id, Number(id)));

		return subscription;
	})
	.get('/:id/analytics', async ({ params }) => {
		const { id } = params;

		const business = await db.query.businesses.findFirst({
			where: eq(businesses.id, Number(id)),
			with: {
				interactions: true,
				subscriptions: {
					where: and(gte(businessSubscriptions.endDate, new Date())),
				},
			},
		});

		if (!business) {
			throw new Error('Business not found');
		}

		const clickCount = business.interactions.filter(
			(i) => i.interactionType === 'click',
		).length;

		const visitCount = business.interactions.filter(
			(i) => i.interactionType === 'visit',
		).length;

		return {
			business,
			metrics: {
				clickCount,
				visitCount,
				isPremiumActive: business.subscriptions.length > 0,
			},
		};
	});
