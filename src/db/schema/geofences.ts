// Geofences table
//
import {
	doublePrecision,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core';

export const geofences = pgTable('geofences', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	latitude: doublePrecision('latitude').notNull(),
	longitude: doublePrecision('longitude').notNull(),
	radius: doublePrecision('radius').notNull(), // in meters
	description: text('description'),
	createdAt: timestamp('created_at').defaultNow(),
});
