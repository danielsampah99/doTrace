import { PlacesClient } from '@googlemaps/places';
import axios, { AxiosError } from 'axios';
// import { PlacesClient } from '@googlemaps/places';
// const {PlacesClient} = require('@googlemaps/places').v1;

export const NORMAL_ENDPOINT =
	'https://places.googleapis.com/v1/places:searchNearby';
export const PRO_ENDPOINT =
	'https://places.googleapis.com/v1/places:searchText';
export const LANGUAGE_CODE = 'en-GB';
export const REGION_CODE = 'GB';
export const PRO_OPEN_NOW = true;
export const PRO_MIN_RATING = 3.5; // external api uses 0.5 ceiling rounding. so 3.5 will become 4 and eliminate everything less that that.
export const MAX_RESULT_COUNT = 10;

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export const recommendBusinesses = async (params: {
	includedTypes: string[];
	radius: number;
	longitude: number;
	latitude: number;
}) => {
	const { radius, longitude, latitude, includedTypes } = params;

	if (!API_KEY) {
		console.error(
			'FATAL: GOOGLE_PLACES_API_KEY environment variable is not set.',
		);
		return []; // Return empty array if API key is missing
	}

	// Request Body Payload
	const requestBody = {
		// Corrected typo from original code
		includedTypes,
		maxResultCount: 10, // Match original logic, adjust if needed (max 20 for nearbySearch)
		locationRestriction: {
			circle: {
				center: {
					latitude: latitude,
					longitude: longitude,
				},
				radius: radius, // The radius in meters.
			},
		},
		// Optional parameters (match original logic or adjust)
		languageCode: LANGUAGE_CODE,
		regionCode: REGION_CODE,
		rankPreference: 'POPULARITY', // POPULARITY or DISTANCE
	};

	// Request Headers
	const headers = {
		'Content-Type': 'application/json',
		'X-Goog-Api-Key': API_KEY,
		'X-Goog-FieldMask':
			'places.id,places.displayName,places.formattedAddress,places.googleMapsLinks,places.googleMapsUri,places.types,places.location,places.websiteUri,places.addressDescriptor',
	};

	try {
		const response = await axios.post(NORMAL_ENDPOINT, requestBody, {
			headers,
		});

		const places = response.data?.places ?? [];
		console.log(`Found ${places.length} places.`);

		return places; // Return the array of places
	} catch (error: any) {
		// Catch block

		// Check if it's an Axios error for more details
		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError<any>; // Type assertion for better access
			console.error('Status Code:', axiosError.response?.status);
			// Log the error response data from Google, if available
			console.error(
				'Error Response Data:',
				JSON.stringify(axiosError.response?.data, null, 2),
			);
			// console.error("Response Headers:", axiosError.response?.headers); // Uncomment if needed
		} else {
			// Log generic errors
			console.error('Non-Axios error occurred:', error.message || error);
		}

		return []; // Return empty array on any error
	} finally {
		console.log('--- Exiting recommendBusinesses function ---');
	}
};

export interface RecommendProBusinessParams {
	textQuery: string;
	radius: number;
	longitude: number;
	latitude: number;
}

export const recommendProBusiness = async (
	params: RecommendProBusinessParams,
): Promise<any[]> => {
	const { latitude, longitude, radius, textQuery } = params;

	const request = {
		textQuery,
		languageCode: LANGUAGE_CODE,
		minRating: PRO_MIN_RATING,
		regionCode: REGION_CODE,
		maxResultCount: MAX_RESULT_COUNT,
		openNow: PRO_OPEN_NOW,
		rankPreference: 'DISTANCE',
		locationBias: {
			circle: {
				center: {
					latitude,
					longitude,
				},
				radius,
			},
		},
	};

	const headers = {
		'Content-Type': 'application/json',
		'X-Goog-Api-Key': API_KEY,
		'X-Goog-FieldMask':
			'places.id,places.displayName,places.formattedAddress,places.googleMapsLinks,places.googleMapsUri,places.types,places.location,places.websiteUri,places.addressDescriptor',
	};

	const response = await axios.post(PRO_ENDPOINT, request, {
		headers,
	});

	if (
		Array.isArray(response?.data?.places) &&
		response?.data?.places.length > 0
	) {
		return response?.data?.places;
	}

	console.dir(response);

	return [];
};
