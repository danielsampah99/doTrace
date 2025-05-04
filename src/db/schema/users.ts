// import {
// 	index,
// 	numeric,
// 	pgTable,
// 	text,
// 	timestamp,
// 	uniqueIndex,
// 	uuid,
// 	varchar,
// } from 'drizzle-orm/pg-core';

// timestamps for audit trails
// columns.helpers.ts
// const timestamps = {
// 	updated_at: timestamp(),
// 	created_at: timestamp().defaultNow().notNull(),
// 	deleted_at: timestamp(),
// };

// the users table.
// export const users = pgTable(
// 	'users',
// 	{
// 		id: uuid('id').defaultRandom().primaryKey(),
// 		phone: text('phone').notNull().unique(), // E.164 standard,
// 		fullName: varchar('full_name'),
// 		defaultLong: numeric('default_long', { precision: 9, scale: 6 }),
// 		defaultLat: numeric('default_lat', { precision: 9, scale: 6 }),
// 		currentLong: numeric('current_long', { precision: 9, scale: 6 }),
// 		currentLat: numeric('current_lat', { precision: 9, scale: 6 }),
// 		...timestamps,
// 	},
// 	(table) => [
// 		index('users_id_idx').on(table.id),
// 		uniqueIndex('users_phone_idx').on(table.phone),
// 	],
// );

import { pgTable, serial, varchar, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
// import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull().unique(),
  preferences: jsonb('preferences').$type<{
    serviceTypes?: string[];
    dietaryRestrictions?: string[];
    preferredBanks?: string[];
  }>(),
  locationTracking: boolean('location_tracking').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});










// Relations
