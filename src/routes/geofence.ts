import { Elysia } from 'elysia';
import { db } from '../db';
// import { geofences } from '../db/schema';
import { eq } from 'drizzle-orm';
import { Client } from '@googlemaps/google-maps-services-js';
import { geofences } from '../db/schema/geofences';

const mapsClient = new Client({});

export const geofenceRouter = new Elysia({ prefix: '/geofence' })
	.post('/', async ({ body }) => {
		const { name, latitude, longitude, radius, description } = body as any;

		// Get address from coordinates
		const response = await mapsClient.reverseGeocode({
			params: {
				latlng: { latitude, longitude },
				key: process.env.GOOGLE_MAPS_API_KEY!,
			},
		});

		const address =
			response.data.results[0]?.formatted_address || description;

		const [geofence] = await db
			.insert(geofences)
			.values({
				name,
				latitude,
				longitude,
				radius,
				description: address,
			})
			.returning();

		return geofence;
	})
	.get('/check', async ({ query }) => {
		const { latitude, longitude } = query as any;

		const allGeofences = await db.query.geofences.findMany();

		// Simple distance calculation (for production, use proper geospatial queries)
		const userGeofences = allGeofences.filter((geofence) => {
			const distance = calculateDistance(
				Number(latitude),
				Number(longitude),
				geofence.latitude,
				geofence.longitude,
			);
			return distance <= geofence.radius;
		});

		return userGeofences;
	});

function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371e3; // Earth radius in meters
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lat2 - lat1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}
