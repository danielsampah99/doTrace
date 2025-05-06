import { Elysia } from 'elysia';
import { db } from '../db';
// import { businesses } from '../db/schema/businesses';
// import { businesses, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema/users';
import twilio from 'twilio';
import type { TwilioWhatsAppWebhook } from '../types';
import { recommendBusinesses } from './recommendations-engine';
import { getCategories } from '../utils';


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export const twilioRouter = new Elysia({ prefix: '/twilio' }).post(
	'/webhook',
	async ({ body }: { body: TwilioWhatsAppWebhook }) => {
		// const {   } = body
		console.dir({"body": body})

		// Normalize phone number
		const normalizedPhone = body.From.replace(/\D/g, '');

		console.log(`twilio's from number: ${body.From}`);
		const userPhone = body.From
		const recipient = `whatsapp:${twilioPhoneNumber}`

		//  --- user lookup ---
		let user = await db.query.users.findFirst({
			where: eq(users.phoneNumber, normalizedPhone),
		});

		const messageText = body.Body.trim().toUpperCase() ?? ''

		if (body.Longitude && body.Latitude && body.MessageType === 'location') {
			console.log(`Received location: Lat ${body.Latitude}, Lon ${body.Longitude}`);

			console.info('starting search')

			// recommend businesses
			const recommendations = await recommendBusinesses({ includedTypes: [user?.searchType ?? ''], radius: 3000, longitude: Number.parseFloat(body.Longitude), latitude: Number.parseFloat(body.Latitude)})

			console.dir(recommendations)

			const messageBody = Array.isArray(recommendations) && recommendations?.length! > 0
				? `Based on your location, here are ${recommendations.length} ${user?.searchType?.replaceAll('_', ' ')} within ${3000} meters:\n ${recommendations.map((service, index) => `${index + 1.} ${service?.displayName?.text} - ${service?.googleMapsLinks?.directionsUri}`).join('\n\n')}`
				: `Thanks for sharing your location! We couldn't find specific recommendations nearby right now, but we'll keep you updated.`

			await client.messages.create({
				body: messageBody, from: recipient, to: userPhone
			})
			return ''
		}

		if (body.Body.toLowerCase().includes('near me')) {
			if (user) {
				// extract and store search term in the db
				const searchType = messageText.toLowerCase().split('near me')[0].trim().replaceAll(' ', '_')

				await db.update(users).set({ searchType }).where(eq(users.id, user.id))

				await client.messages.create({
					body: `Hello, ${body.ProfileName}, Please send your location, for ${searchType.replaceAll('_', ' ')} near you`,
					from: recipient,
					to: userPhone,
				});
				return '';
			}
		}

		if (messageText === 'CATEGORIES') {
			if (!user) {
				await client.messages.create({
					body: `Hello ${body.ProfileName || 'there'}! Please register first by sending HELP to this number, then you can ask for categories.`,
					from: recipient,
					to: userPhone,
				});
				return '';
			}

			const categoriesList = getCategories()

			if (categoriesList.length > 1600) {
				await client.messages.create({
					body: `Message limit hit, refere to website for full list of search categories`,
					from: recipient,
					to: userPhone
				})
				return ''
			}

			await client.messages.create({
				body: categoriesList,
				from: recipient,
				to: userPhone
			})
			return ''
		}

		// 1. HELP / REGISTRATION
		if (body.Body.trim().toUpperCase() === 'HELP') {

			if (!user) {
				// Register new user
				try {
					[user] = await db
						.insert(users)
						.values({
							phoneNumber: normalizedPhone,
							locationTracking: true,
						})
						.returning();

					console.info(`registered a new user: ${user.phoneNumber}`);
					await client.messages.create({
						body: `Hello ${body.ProfileName!}, Welcome to doTrace! We will send you recommendations when you enter specific locations. Simply send your location.`,
						from: recipient,
						to: userPhone,
					});
					return '';

			} catch (error) {
				console.error('Error registering user:', error);

				await client.messages.create({
					body: 'Sorry, there was an error registering you. Please try again later.',
					from: recipient,
					to: userPhone,
				});
			}
		} else {
			// what can doTrace do? TODO: save last location of the user
			await client.messages.create({
				body: `Hi ${body.ProfileName!}! Here's how you can use doTrace:\n\n1. Send your *location* 📍 to get nearby recommendations.\n2. Search directly (e.g., "Gas stations near me").\n3. Reply with *PREFERENCES* to view/update yours.\n4. Reply with *Categories* for full list of search categories we support.\n5. Reply with *HELP* to see this message again.`,
				from: recipient,
				to: userPhone,
			});
			// return ''
		}

		if (messageText === 'PREFERENCES') {
			if (!user) {
				await client.messages.create({
					body: 'Please register first by sending HELP to this number.',
					from: `whatsapp:${twilioPhoneNumber}`,
					to: userPhone,
				});
				return '';
			}

			await client.messages.create({
				body: `Current preferences:\n\n1. Bank: ${user.preferences?.preferredBanks || 'Not set'}\n2. Cuisine: ${user.preferences?.dietaryRestrictions?.join(', ') || 'Any'}\n\nReply with:\n- "SET BANK [name]"\n- "SET DIET [vegetarian/vegan/etc]"`,
				from: `whatsapp:${twilioPhoneNumber}`,
				to: userPhone,
			});
			return '';
		}

		if (!user) {
			await client.messages.create({
				body: `Hello ${body.ProfileName}! Please register first by sending HELP to this number.`,
								from: recipient,
								to: userPhone,
			})
		}

		// // Handle preferences


		// if (body.Longitude && body.Latitude && body.MessageType === 'location') {
		// 	console.log(`Received location: Lat ${body.Latitude}, Lon ${body.Longitude}`);

		// 	console.info('starting search')

		// 	// recommend businesses
		// 	const recommendations = await recommendBusinesses({ radius: 3000, longitude: Number.parseFloat(body.Longitude), latitude: Number.parseFloat(body.Latitude)})

		// 	console.dir(recommendations)

		// 	const messageBody = recommendations && typeof recommendations !== 'string' && Array.isArray(recommendations) && recommendations?.length! > 0
		// 		? `Based on your location, here are some recommendations:\n ${recommendations?.map((service, index) => `${index + 1.} ${service?.name} - ${service?.address | 'Address not available'}`).join('\n')}`
		// 		: `Thanks for sharing your location! We couldn't find specific recommendations nearby right now, but we'll keep you updated.`

		// 	await client.messages.create({
		// 		body: messageBody, from: recipient, to: userPhone
		// 	})
		// 	return ''
		// }

		// Handle service requests


		// 	await client.messages.create({
		// 		body: "Kindly share your location with me",
		// 		from:`whatsapp:${twilioPhoneNumber}`,
		// 		to: userPhone
		// 	})



		// 	const serviceType = message
		// 		.toLowerCase()
		// 		.replace('near me', '')
		// 		.trim();
		// 	const recommendations = await recommendServices({
		// 		userId: user.id,
		// 		serviceType,
		// 		latitude: 0, // TODO: Get user's current location
		// 		longitude: 0, // TODO: Get user's current location
		// 	});

		// 	const messageBody =
		// 		recommendations.length > 0
		// 			? `Here are nearby ${serviceType}s:\n${recommendations
		// 					.map((b, i) => `${i + 1}. ${b.name} - ${b.address}`)
		// 					.join('\n')}`
		// 			: `No ${serviceType}s found nearby.`;

		// 	await client.messages.create({
		// 		body: messageBody,
		// 		from: `whatsapp:${twilioPhoneNumber}`,
		// 		to: userPhone,
		// 	});
		// 	return '';
		// }



		// // Handle preference updates
		// if (message.toUpperCase().startsWith('SET BANK')) {
		// 	const bankName = message.substring(9).trim();
		// 	await db
		// 		.update(users)
		// 		.set({
		// 			preferences: {
		// 				...(user?.preferences || {}),
		// 				"preferredBanks": [bankName],
		// 			},
		// 		})
		// 		.where(eq(users.phoneNumber, normalizedPhone));

		// 	await client.messages.create({
		// 		body: `✅ Preferred bank set to: ${bankName}`,
		// 		from: `whatsapp:${twilioPhoneNumber}`,
		// 		to: userPhone,
		// 	});
		// 	return '';
		// }

		// if (message.toUpperCase().startsWith('SET DIET')) {
		// 	const diet = message.substring(9).trim().toLowerCase();
		// 	await db
		// 		.update(users)
		// 		.set({
		// 			preferences: {
		// 				...(user?.preferences || {}),
		// 				dietaryRestrictions: [diet],
		// 			},
		// 		})
		// 		.where(eq(users.phoneNumber, normalizedPhone));

		// 	await client.messages.create({
		// 		body: `✅ Dietary preference set to: ${diet}`,
		// 		from: `whatsapp:${twilioPhoneNumber}`,
		// 		to: userPhone,
		// 	});
		// 	return '';
		// }

		// if (body.MessageType === 'text' && messageText != '') {
		// 	await client.messages.create({
  //               body: "Sorry, I didn't understand that command. Send HELP for options.",
  //               from: recipient, // Use recipient consistently
  //               to: userPhone
  //               })
		// } else if (body.MessageType != 'text' && body.MessageType != 'location') {
		// 	console.warn(`Received unhandled message type: ${body.MessageType}`)

		// 	await client.messages.create({
  //               body: "Sorry, I didn't understand that command. Send HELP for options.",
  //               from: recipient, // Use recipient consistently
  //               to: userPhone
  //               })
		// 	return ''
		// }

		// Default response


		}
	}
);
