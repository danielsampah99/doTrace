import axios, { AxiosError } from 'axios';
// import { PlacesClient } from '@googlemaps/places';
// const {PlacesClient} = require('@googlemaps/places').v1;

export const recommendBusinesses = async (params: {
	includedTypes: string[];
	radius: number;
	longitude: number;
	latitude: number;
}) => {
	const { radius, longitude, latitude, includedTypes } = params;

	const apiKey = process.env.GOOGLE_PLACES_API_KEY;

	console.info('--- recommendBusinesses (using Axios) ---');
	console.info('Params:', params);

	if (!apiKey) {
		console.error(
			'FATAL: GOOGLE_PLACES_API_KEY environment variable is not set.',
		);
		return []; // Return empty array if API key is missing
	}
	console.info('API key found.');

	// API Endpoint
	const endpoint = 'https://places.googleapis.com/v1/places:searchNearby';

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
		languageCode: 'en-GB',
		regionCode: 'GB', // Use a CLDR region code like 'GB', 'US', etc.
		rankPreference: 'POPULARITY', // POPULARITY or DISTANCE
	};

	// Request Headers
	const headers = {
		'Content-Type': 'application/json',
		'X-Goog-Api-Key': apiKey,
		'X-Goog-FieldMask':
			'places.id,places.displayName,places.formattedAddress,places.googleMapsLinks,places.googleMapsUri,places.types,places.location,places.websiteUri,places.addressDescriptor',
	};

	console.log('Attempting Axios POST to:', endpoint);
	// console.log("Request Body:", JSON.stringify(requestBody, null, 2)); // debugging
	// console.log("Headers:", headers); // debugging

	try {
		console.log('Sending request via Axios...');
		console.time('axiosApiCallDuration'); // Start timer

		// Make the POST request using axios
		const response = await axios.post(endpoint, requestBody, { headers });

		console.timeEnd('axiosApiCallDuration'); // End timer
		console.log('Axios request successful. Status:', response.status);

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
