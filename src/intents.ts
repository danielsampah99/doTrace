export const intentMap = {
	get_categories: {
		phrases: [
			'categories',
			'what can i search',
			'what do you have',
			'list of things',
			'search options',
			'options',
			'things you support',
			'list categories',
			'what kind of businesses',
			'services offered',
		],
		reply: "Here's a list of what you can search. 🔍\n\n",
	},
	register: {
		phrases: [
			'help',
			'start',
			'join',
			'how does this work',
			'register me',
			'i want to join',
		],
		reply: 'Hi there 👋! Just send *HELP* to get started.',
	},
	share_location: {
		phrases: [
			'here',
			'this place',
			'near me',
			'find places nearby',
			'places close to me',
			'i’m at',
			'this location',
			'i’m here',
			'my location',
			'location',
		],
		reply: 'Awesome! Please share your location 📍 so I can help you find nearby services.',
	},
	recommend_something: {
		phrases: [
			'restaurants near me',
			'banks nearby',
			'gas station close',
			'i need a hospital',
			'any good salons here',
			'atm close by',
			'nearest pharmacy',
			'good food near me',
		],
		reply: 'Got it! Please share your location so I can send recommendations. 📡',
	},
	preferences: {
		phrases: [
			'preferences',
			'my preferences',
			'settings',
			'my info',
			'my details',
		],
		reply: 'Here are your current preferences. 🧠 To update, reply with SET BANK or SET DIET.',
	},
	set_bank: {
		phrases: ['set bank', 'change bank', 'bank preference', 'i use bank'],
		reply: 'Please reply like: *SET BANK Ecobank* ✅',
	},
	set_diet: {
		phrases: [
			'set diet',
			'change diet',
			'i eat',
			'my diet',
			'i’m vegetarian',
		],
		reply: 'Please reply like: *SET DIET vegetarian* 🥗',
	},
	unknown: {
		phrases: [],
		reply: "Sorry, I didn’t understand that 🤔. Try something like 'Gas stations near me' or just send your location!",
	},
};

export const getLocationUpdateResponse = (userName: string): string => {
	const messages = [
		`Alright, ${userName}, your location has been updated. This will be the default location used when you interact with me. To update it, just send your location again.`,
		`Great, ${userName}, I've updated your location.  Now I can give you better recommendations nearby. Send your location again to change it.`,
		`Location saved, ${userName}!  I'll use this to find things near you.  Send me your location again if you move.`,
		`Okay, ${userName}, location updated! I'm ready to show you what's around you. To change your location, simply send it again.`,
		`Got it, ${userName}, your location is now set.  I'll use this to give you relevant recommendations.  Update it any time!`,
	];

	const randomIndex = Math.floor(Math.random() * messages.length);

	return messages[randomIndex];
};

export function detectIntent(message: string): keyof typeof intentMap {
	const text = message.toLowerCase();

	for (const [intent, data] of Object.entries(intentMap)) {
		if (data.phrases.some((p) => text.includes(p))) {
			return intent as keyof typeof intentMap;
		}
	}

	return 'unknown';
}
