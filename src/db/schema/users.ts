import {
	pgTable,
	varchar,
	timestamp,
	boolean,
	jsonb,
	integer,
	text,
	decimal,
} from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	phoneNumber: varchar('phone_number', { length: 20 }).notNull().unique(),
	preferences: jsonb('preferences').$type<{
		serviceTypes?: string[];
		dietaryRestrictions?: string[];
		preferredBanks?: string[];
	}>(),
	locationTracking: boolean('location_tracking').default(true),
	searchType: varchar('search_type', { length: 50 }),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	lastSearchedText: text('last_searched_text'),
	longitude: decimal('longitude'),
	latitude: decimal('latitude'),
	isPro: boolean('is_pro').default(false),
	locationUpdatedAt: timestamp('location_updated_at'),
});
