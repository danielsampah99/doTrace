import { GoogleGenAI } from '@google/genai';
// import { businesses } from '../db/schema/businesses';
// import { businesses, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import twilio from 'twilio';
import { db } from '../db';
import { users as usersTable } from '../db/schema/users';
import {
	getHelpResponse,
	getLocationUpdateResponse,
	isCategoryRequest,
	isHelpRequest,
	isNonPaidRequest,
} from '../intents';
import type { TwilioWhatsAppWebhook } from '../types';
import { getCategories } from '../utils';
import { recommendProBusiness } from './recommendations-engine';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const client = twilio(accountSid, authToken);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY, vertexai: false });

export const twilioRouter = new Elysia({ prefix: '/twilio' }).post(
	'/webhook',
	async ({ body }: { body: TwilioWhatsAppWebhook }) => {
		console.dir({ body: body });

		// Normalize phone number
		const normalizedPhone = body.From.replace(/\D/g, '');

		console.log(`twilio's from number: ${body.From}`);
		const userPhone = body.From;
		const recipient = `whatsapp:${twilioPhoneNumber}`;
		const userName = body.ProfileName ?? 'there';

		if (!GEMINI_API_KEY) {
			throw new Error(
				'GEMINI_API_KEY is not set in environment variables.',
			);
		}

		//  --- user lookup ---
		const user = await db.query.users.findFirst({
			where: eq(usersTable.phoneNumber, normalizedPhone),
		});

		const messageText = body.Body.trim().toLocaleLowerCase('en-GB') ?? '';

		/**
		 * register a new user if they have not yet been registered ---
		 */
		if (!user) {
			try {
				await db
					.insert(usersTable)
					.values({
						phoneNumber: userPhone,
						isPro: false,
					})
					.returning();
			} catch (e) {
				console.error('new user error: ', e);
				await client.messages.create({
					to: userPhone,
					from: recipient,
					body: `Something went wrong in trying to register ${userName} as a user.`,
				});
				return '';
			}

			// let the user know their account has been successfully registered.
			await client.messages.create({
				body: `Hello, ${userName}, welcome to 10nearby!
							Send me your location once and I'll use that to find nearby places for you.
							You can update your location anytime by resending a new one. Need guidance?
							Just reply with /help to learn how to use me.
							`,
				from: recipient,
				to: userPhone,
			});
			return '';
		}

		/**
		 * Handle when the user sends just their location
		 */
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

		/**
		 * Serve requests that are for pro users
		 */
		if (!!user?.isPro) {
			// const query = body.Body;
			// const places = await recommendProBusiness({
			// 	latitude: user?.latitude ? Number.parseFloat(user.latitude) : 0,
			// 	longitude: user?.longitude
			// 		? Number.parseFloat(user.longitude)
			// 		: 0,
			// 	radius: 3000,
			// 	textQuery: query.toLowerCase(),
			// });

			// const response =
			// 	places.length > 0
			// 		? `Here is, **${query.toLocaleLowerCase('en-GB')}**.\n
			// 	${places.map((item, index) => `${index + 1}. 📍 ${item?.displayName?.text} - 🗺️ ${item?.googleMapsLinks?.directionsUri}`).join('\n\n')}
			// 	`
			// 		: `No results for ${query.toLowerCase()}`;

			try {
				console.info('--- using gemini-ai---');
				console.time('Starting');
				const response = await ai.models.generateContent({
					model: 'gemini-2.0-flash',
					contents: `${messageText}. If it helps, my longitude is: ${user.latitude} and latitude is ${user.longitude}.
				 				Use that for the request, please, rank the responses in order of proximity to my coordinates and SHOULD always be a list of ten results.
								No more than that. ever.`,
					config: {
						tools: [
							{
								// googleMaps: { authConfig: { }}, google maps also not available in gemini
								// googleSearch: {}, Enterprise web search is not available in gemini
								// googleSearchRetrieval: {},
							},
						],
						toolConfig: {
							retrievalConfig: {
								latLng: {
									latitude: user.latitude
										? Number.parseFloat(user.latitude)
										: 0,
									longitude: user.longitude
										? Number.parseFloat(user.longitude)
										: 0,
								},
							},
						},
					},
				});

				console.info('--Gemini response: ', response);
				console.timeEnd('--Gemini responded---');

				await client.messages.create({
					body: response.text,
					from: recipient,
					to: userPhone,
					shortenUrls: true,
				});
				return '';
			} catch (e) {
				console.error('could not use gemini: ', e);
				await client.messages.create({
					body: `Something went wrong with your pro request. Please try again soon.`,
					from: recipient,
					to: userPhone,
					shortenUrls: true,
				});
				return ''
			}
		}

		/**
		 * take care of normal users
		 */
		if (isNonPaidRequest(body.Body.toLowerCase().trim())) {
			// const searchType = findCategoryInRequest(
			// 	body.Body.toLowerCase().trim(),
			// );

			// if (searchType) {
			// 	await db
			// 		.update(usersTable)
			// 		.set({ searchType })
			// 		.where(eq(usersTable.id, user.id));

			// 	// make search with keyword
			// 	const recommendations = await recommendBusinesses({
			// 		includedTypes: [searchType ?? ''],
			// 		radius: 3000,
			// 		longitude: user?.longitude
			// 			? Number.parseFloat(user.longitude)
			// 			: 0,
			// 		latitude: user?.latitude
			// 			? Number.parseFloat(user?.latitude)
			// 			: 0,
			// 	});

			// 	const messageBody =
			// 		Array.isArray(recommendations) &&
			// 		recommendations?.length! > 0
			// 			? `Okay, here are ${recommendations.length} ${searchType?.replaceAll('_', ' ')} within ${3000} meters:\n ${recommendations.map((service, index) => `${index + 1} ${service?.displayName?.text} - ${service?.googleMapsLinks?.directionsUri}`).join('\n\n')}`
			// 			: `Thanks for your input! I can't process your request at the moment. Kindly try again soon`;

			// 	await client.messages.create({
			// 		body: messageBody, // send results
			// 		from: recipient,
			// 		to: userPhone,
			// 	});
			// 	return '';
			// }
			//
			try {
				const places = await recommendProBusiness({
					latitude: user?.latitude
						? Number.parseFloat(user.latitude)
						: 0,
					longitude: user?.longitude
						? Number.parseFloat(user.longitude)
						: 0,
					radius: 3000,
					textQuery: messageText,
				});

				const response =
					places.length > 0
						? `Here is, **${messageText}**.\n
				${places.map((item, index) => `${index + 1}. 📍 ${item?.displayName?.text} - 🗺️ ${item?.googleMapsLinks?.directionsUri}`).join('\n\n')}
				`
						: `No results for ${messageText}. ${Math.floor(Math.random() * 2) > 1 && 'Perhaps, you should try upgrading your account using the console...'}`;

				await client.messages.create({
					body: response,
					from: recipient,
					to: userPhone,
				});
				return '';
			} catch (e) {
				console.error(
					`Something went wrong with normal requests. ${e}`,
				);

				await client.messages.create({
					body: 'Something went wrong with your request. Please try again...',
					from: recipient,
					to: userPhone,
				});
				return ''
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
