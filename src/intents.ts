
export const PRIMARY_HELP_TERMS = ['help', 'assist', 'support', 'guide', 'info'];

export const PRIMARY_CATEGORY_TERMS = [	'categories', 'what can i search', 'what do you have', 'list of things', 'search options', 'options', 'things you support', 'list categories', 'what kind of businesses', 'services offered']

export const getHelpResponse = (userName: string): string => `
	"Hey there, ${!!Math.floor(Math.random()) ? userName : ''}! 👋. I'm the 10nearBy chatbot and here's what I can do for you:"

    🔍 Search for Places: "Send me a location (e.g., 'bank near me' or 'KFC near me' which only works for premium users), and I'll fetch the best results!"

    📍 Get Directions: "Need directions? Try: 'How do I get from Delhi to Jaipur by car?' or 'Walking directions to Central Park.'"

    🌟 Top-Rated Spots: "Want recommendations? Ask: 'Best Italian restaurants nearby' or 'Top-rated hotels in Dubai.'"

    📞 Contact & Hours: "I can check business hours or phone numbers—just ask: 'Is Starbucks open now?' or 'What’s the number for Pizza Hut in Bangalore?'"

    � Nearby Essentials: "Looking for our classifications? Try: '/categories'  to see our full list of categories for non-premium users"

    "Just type what you need, and I’ll handle the rest! 😊"
	`

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


export const helpKeywords: string[] = [
    'help', 'assist', 'support', 'guide', 'guidance', 'info', 'information', 'hello', 'hi',
    'instruction', 'how to', 'how do i', 'commands', 'options', 'menu',
    'what can you do', 'what do you do', 'features', 'capabilities',
    'documentation', 'manual', 'tutorial', 'usage', 'directions', 'explain',
    'show me', 'tell me', 'need assistance', 'need help', 'lost', 'confused',
    'stuck', 'don\'t understand', 'don\'t know how', 'not sure how',
    'how does this work', 'how to use', 'what can i do', 'what are my options',
    'can you help', 'please help', 'need support', 'assistance please',
    'guidance needed', 'instructions please', 'how do you work', 'faq',
    'frequently asked questions', 'quick start', 'getting started',
    'help menu', 'help section', 'available commands', 'command list',
    'list commands', 'list options', 'list features', 'show commands',
    'show options', 'show features', 'what can i ask', 'what should i do',
    'how to interact', 'how can i use'
  ]

export const questionStarters: string[] = ['can you', 'could you', 'would you', 'will you', 'how do i', 'how can i', 'what is', 'what are', 'is there'];

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

export const isCloseMatch = (input: string, keyword: string): boolean => {
	// check for word boundaries
	const words = input.split(/\s+/)

	for (const word of words) {
		if (word === keyword) { // exact match
			return true
		}

		// check for short words
		if (Math.abs(word.length - keyword.length) > 1) {
			continue
		}

		// transpositions and character substitutions
		if (keyword.length <= 4) { // allow one character diff for short words
			let differences = 0;

			for (let i = 1; i < Math.max(word.length, keyword.length); i++) {
				if (keyword[i] !== word[i]) {
					differences++
				}

				if (differences > 1) {
					break
				}
			}

			if (differences <= 1) {
				return true
			}

		} else {
			let differences = 0 // allow more for longer words
			const maxDiff = Math.floor(keyword.length / 3)

			for (let i = 0; Math.max(word.length, keyword.length); i++) {
				if (keyword[i] !== word[i]) {
					differences++
				}

				if (differences > maxDiff) {
					break
				}
			}

			if (differences <= maxDiff) {
				return true
			}
		}
	}
	return false
}


export const isHelpRequest = (userInput: string): boolean => {
	if (!userInput || typeof userInput !== 'string') {
		return false
	}

	// convert input to lowercase for normalization
	const normalizedInput = userInput.toLowerCase().trim()

	// direct keyword match
	if (helpKeywords.some((word) =>
		normalizedInput === word || normalizedInput.includes(` ${word} `) || normalizedInput.startsWith(`${word} `) || normalizedInput.endsWith(` ${word}`) || normalizedInput.includes(`${word}?`)
	)) {
			return true
		}

	// detect questions
	for (const question of questionStarters) {
		if (normalizedInput.startsWith(userInput)) {
			const remaining = normalizedInput.substring(question.length).trim()

			if (helpKeywords.some(word => remaining.includes(word) || remaining.startsWith(word) || remaining.endsWith(word))) {
				return true
			}
		}
	}

	// check for keyword typos
	for (const help of PRIMARY_HELP_TERMS) {

		if (isCloseMatch(normalizedInput, help)) {
			return true
		}
	}

	return false
}

export function detectIntent(message: string): keyof typeof intentMap {
	const text = message.toLowerCase();

	for (const [intent, data] of Object.entries(intentMap)) {
		if (data.phrases.some((p) => text.includes(p))) {
			return intent as keyof typeof intentMap;
		}
	}

	return 'unknown';
}
