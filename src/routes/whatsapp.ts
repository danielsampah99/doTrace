import { Elysia } from 'elysia';
import { db } from '../db';
// import { businesses, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { businesses } from '../db/schema/businesses';
import { users } from '../db/schema/users';
import twilio from 'twilio';
import { recommendServices } from './recommendations-engine';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export const twilioRouter = new Elysia({ prefix: '/twilio' }).post(
	'/webhook',
	async ({ body }) => {
		const { From: userPhone, Body: message } = body as {
			From: string;
			Body: string;
		};

		// Normalize phone number
		const normalizedPhone = userPhone.replace(/\D/g, '');

		// Check if user exists
		let user = await db.query.users.findFirst({
			where: eq(users.phoneNumber, normalizedPhone),
		});

		// Handle registration
		if (message.trim().toUpperCase() === 'HELP') {
			if (!user) {
				// Register new user
				[user] = await db
					.insert(users)
					.values({
						phoneNumber: normalizedPhone,
						locationTracking: true,
					})
					.returning();
			}

			await client.messages.create({
				body: 'Welcome to doTrace! We will send you recommendations when you enter specific locations. To manage preferences, reply with PREFERENCES.',
				from: `whatsapp:${twilioPhoneNumber}`,
				to: `whatsapp:${userPhone}`,
			});
			return 'OK';
		}

		// Handle service requests
		if (message.toLowerCase().includes('near me')) {
			if (!user) {
				await client.messages.create({
					body: 'Please register first by sending HELP to this number.',
					from: `whatsapp:${twilioPhoneNumber}`,
					to: `whatsapp:${userPhone}`,
				});
				return 'OK';
			}

			const serviceType = message
				.toLowerCase()
				.replace('near me', '')
				.trim();
			const recommendations = await recommendServices({
				userId: user.id,
				serviceType,
				latitude: 0, // TODO: Get user's current location
				longitude: 0, // TODO: Get user's current location
			});

			const messageBody =
				recommendations.length > 0
					? `Here are nearby ${serviceType}s:\n${recommendations
							.map((b, i) => `${i + 1}. ${b.name} - ${b.address}`)
							.join('\n')}`
					: `No ${serviceType}s found nearby.`;

			await client.messages.create({
				body: messageBody,
				from: `whatsapp:${twilioPhoneNumber}`,
				to: `whatsapp:${userPhone}`,
			});
			return 'OK';
		}

		// Default response
		await client.messages.create({
			body: "Sorry, I didn't understand that. Send HELP for assistance.",
			from: `whatsapp:${twilioPhoneNumber}`,
			to: `whatsapp:${userPhone}`,
		});
		return 'OK';
	},
);
