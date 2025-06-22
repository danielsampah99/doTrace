import {
	integer,
	jsonb,
	pgTable,
	serial,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core';
import { businesses } from './businesses';
import { users } from './users';

// User interactions table
export const userInteractions = pgTable('user_interactions', {
	id: serial('id').primaryKey(),
	userId: integer('user_id').references(() => users.id),
	businessId: integer('business_id').references(() => businesses.id),
	interactionType: varchar('interaction_type', { length: 50 }).notNull(), // 'search', 'click', 'visit'
	timestamp: timestamp('timestamp').defaultNow(),
	details: jsonb('details'),
});
