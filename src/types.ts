export interface TwilioWhatsAppWebhook {
	// Core Message Info
	MessageSid: string;
	SmsSid: string;
	SmsMessageSid: string;
	AccountSid: string;
	MessagingServiceSid?: string;

	From: string;
	To: string;
	Body: string;
	NumMedia: string;
	NumSegments: string;
	ApiVersion: string;

	// WhatsApp-specific
	ProfileName?: string;
	WaId: string;
	Forwarded?: string;
	FrequentlyForwarded?: string;
	ButtonText?: string;

	// Media (up to 10 for safety)
	MediaContentType0?: string;
	MediaUrl0?: string;
	MediaContentType1?: string;
	MediaUrl1?: string;
	MediaContentType2?: string;
	MediaUrl2?: string;
	// Add more if needed...

	// Geo
	Latitude?: string;
	Longitude?: string;
	Address?: string;
	Label?: string;

	// Geo (From / To metadata)
	FromCity?: string;
	FromState?: string;
	FromZip?: string;
	FromCountry?: string;
	ToCity?: string;
	ToState?: string;
	ToZip?: string;
	ToCountry?: string;

	// Referral (Click-to-WhatsApp)
	ReferralBody?: string;
	ReferralHeadline?: string;
	ReferralSourceId?: string;
	ReferralSourceType?: string;
	ReferralSourceUrl?: string;
	ReferralMediaId?: string;
	ReferralMediaContentType?: string;
	ReferralMediaUrl?: string;
	ReferralNumMedia?: string;
	ReferralCtwaClid?: string;

	// Replies
	OriginalRepliedMessageSender?: string;
	OriginalRepliedMessageSid?: string;

	// Fallback for unknown params
	[key: string]: string | undefined;
}
