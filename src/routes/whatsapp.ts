import { Elysia } from 'elysia';
import { db } from '../db';
// import { businesses } from '../db/schema/businesses';
// import { businesses, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { users as usersTable } from '../db/schema/users';
import twilio from 'twilio';
import type { TwilioWhatsAppWebhook } from '../types';
import { findCategoryInRequest, getCategories } from '../utils';
import {
	getHelpResponse,
	getLocationUpdateResponse,
	isCategoryRequest,
	isHelpRequest,
	isNonPaidRequest,
} from '../intents';
import {
	recommendBusinesses,
	recommendProBusiness,
} from './recommendations-engine';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export const twilioRouter = new Elysia({ prefix: '/twilio' }).post(
	'/webhook',
	async ({ body }: { body: TwilioWhatsAppWebhook }) => {
		// const {   } = body
		console.dir({ body: body });

		// Normalize phone number
		const normalizedPhone = body.From.replace(/\D/g, '');

		console.log(`twilio's from number: ${body.From}`);
		const userPhone = body.From;
		const recipient = `whatsapp:${twilioPhoneNumber}`;
		const userName = body.ProfileName ?? 'there';

		//  --- user lookup ---
		let user = await db.query.users.findFirst({
			where: eq(usersTable.phoneNumber, normalizedPhone),
		});

		const messageText = body.Body.trim().toUpperCase() ?? '';

		// --- whenever the user sends their location, it's updated and saved with a notification sent to them. ---

		if (
			body.Longitude &&
			body.Latitude &&
			body.MessageType === 'location'
		) {
			await db
				.update(usersTable)
				.set({
					latitude: body.Latitude,
					longitude: body.Longitude,
					locationUpdatedAt: new Date(),
				})
				.where(eq(usersTable.phoneNumber, normalizedPhone));

			// recommend businesses
			// const recommendations = await recommendBusinesses({
			// 	includedTypes: [user?.searchType ?? ''],
			// 	radius: 3000,
			// 	longitude: Number.parseFloat(body.Longitude),
			// 	latitude: Number.parseFloat(body.Latitude),
			// });

			// console.dir(recommendations);

			// const messageBody = Array.isArray(recommendations) && recommendations?.length! > 0
			// 	? `Based on your location, here are ${recommendations.length} ${user?.searchType?.replaceAll('_', ' ')} within ${3000} meters:\n ${recommendations.map((service, index) => `${index + 1.} ${service?.displayName?.text} - ${service?.googleMapsLinks?.directionsUri}`).join('\n\n')}`
			// 	: `Thanks for sharing your location! We couldn't find specific recommendations nearby right now, but we'll keep you updated.`

			const messageBody = getLocationUpdateResponse(userName);

			await client.messages.create({
				body: messageBody,
				from: recipient,
				to: userPhone,
			});
			return '';
		}



		// check for help requests
		if (isHelpRequest(body.Body.toLowerCase())) {
			console.info('this is a help request');

			// add the user if their account is non existent
			if (!user) {
				console.info('new user...');
				try {
					await db
						.insert(usersTable)
						.values({
							phoneNumber: userPhone,
						})
						.returning();
				} catch (e) {
					console.error('new user error: ', e);
				}

				// send the response to the user
				await client.messages.create({
					body: `Hello, ${userName}, welcome to 10nearby. reply with **/help** whenever you feel lost on how to use me.`,
					from: recipient,
					to: userPhone,
				});
				return '';
			}

			// send help message to client or user
			await client.messages.create({
				body: getHelpResponse(userName),
				from: recipient,
				to: userPhone,
			});

			return '';
		}


		// ----- check for category requests ---
		if (isCategoryRequest(body.Body.toLowerCase().trim())) {
			if (!user) {
				await client.messages.create({
					body: `Hello ${body.ProfileName || 'there'}! Please register first by sending HELP to this number, then you can ask for categories.`,
					from: recipient,
					to: userPhone,
				});
				return '';
			}

			const categoriesList = getCategories();

			if (categoriesList.length > 1600) {
				await client.messages.create({
					body: `Message limit hit, refer to website for full list of search categories`,
					from: recipient,
					to: userPhone,
				});
				return '';
			}

			await client.messages.create({
				body: categoriesList,
				from: recipient,
				to: userPhone,
			});
			return '';
		}


		// satisfy pro users
		if (!!user?.isPro) {
			const query = body.Body;
			const places = await recommendProBusiness({
				latitude: user?.latitude ? Number.parseFloat(user.latitude) : 0,
				longitude: user?.longitude
					? Number.parseFloat(user.longitude)
					: 0,
				radius: 3000,
				textQuery: query.toLowerCase(),
			});

			const response = places.length > 0 ? `Here is, **${query.toLocaleLowerCase('en-GB')}**.\n
				${places.map((item, index) => `${index + 1}. 📍 ${item?.displayName?.text} - 🗺️ ${item?.googleMapsLinks?.directionsUri}`).join('\n\n')}
				` : `No results for ${query.toLowerCase()}`;

			await client.messages.create({
				body: response,
				from: recipient,
				to: userPhone,
				shortenUrls: true,
			});
			return '';
		}

		if (isNonPaidRequest(body.Body.toLowerCase().trim())) {
			console.info('This is a paid request');

			if (user) {
				// extract and store search term in the db
				//
				console.info(
					`I'm about to do find and extract the category: ${body.Body.toLowerCase().trim()} in the request`,
				);
				const searchType = findCategoryInRequest(
					body.Body.toLowerCase().trim(),
				);

				if (searchType) {
					await db
						.update(usersTable)
						.set({ searchType })
						.where(eq(usersTable.id, user.id));

					// make search with keyword
					const recommendations = await recommendBusinesses({
						includedTypes: [searchType ?? ''],
						radius: 3000,
						longitude: user?.longitude
							? Number.parseFloat(user.longitude)
							: 0,
						latitude: user?.latitude
							? Number.parseFloat(user?.latitude)
							: 0,
					});

					const messageBody =
						Array.isArray(recommendations) &&
						recommendations?.length! > 0
							? `Okay, here are ${recommendations.length} ${searchType?.replaceAll('_', ' ')} within ${3000} meters:\n ${recommendations.map((service, index) => `${index + 1} ${service?.displayName?.text} - ${service?.googleMapsLinks?.directionsUri}`).join('\n\n')}`
							: `Thanks for your input! I can't process your request at the moment. Kindly try again soon`;

					await client.messages.create({
						body: messageBody, // send results
						from: recipient,
						to: userPhone,
					});
					return '';
				}

				await client.messages.create({
					body: `Sorry i did not catch your request.
						Perhaps you'd want to send categories to see the full list of potential searches for a free account`,
					from: recipient,
					to: userPhone,
				});
				return '';
			}
		}



		// --- default no response ---
		await client.messages.create({
			body: `Sorry ${!!Math.floor(Math.random()) ? userName : ''}, I did not catch that. Could you try again or modify your request?`,
			from: recipient,
			to: userPhone,
		});

		return '';
	},
);

// DONALD WEWOLI AKITE
