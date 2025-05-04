import { db } from '../db';
// import { businesses, userInteractions, users } from '../db/schema';
import { eq, and, or, desc, sql, gt } from 'drizzle-orm';
import { users } from '../db/schema/users';
import { businesses } from '../db/schema/businesses';

interface RecommendationParams {
	userId: number;
	serviceType?: string;
	latitude: number;
	longitude: number;
	limit?: number;
}

export async function recommendServices(params: RecommendationParams) {
	const { userId, serviceType, latitude, longitude, limit = 5 } = params;

	// Get user preferences
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	const userPreferences = user?.preferences || {};

	// Base query
	let query = db
		.select({
			business: businesses,
			distance:
				sql<number>`|/((${businesses.latitude} - ${latitude})^2 + (${businesses.longitude} - ${longitude})^2)`.as(
					'distance',
				),
		})
		.from(businesses)
		.where(serviceType ? eq(businesses.type, serviceType) : undefined)
		.orderBy(
			// Prioritize premium businesses
			businesses.isPremium ? desc(businesses.isPremium) : undefined,
			// Then by distance
			sql`distance`,
		)
		.limit(limit);

	// Filter by user preferences if available
	if (userPreferences.serviceTypes?.length) {
		query = query.where(
			or(
				...userPreferences.serviceTypes.map((t) =>
					eq(businesses.type, t),
				),
			),
		);
	}

	const results = await query;

	return results.map((r) => ({
		...r.business,
		distance: r.distance,
	}));
}
