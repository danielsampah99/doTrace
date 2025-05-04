// Businesses table

import { doublePrecision, jsonb, pgTable, serial, boolean, text, timestamp, varchar  } from "drizzle-orm/pg-core";

export const businesses = pgTable('businesses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'restaurant', 'hospital', 'pharmacy', etc.
  address: text('address').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  contactNumber: varchar('contact_number', { length: 20 }),
  openingHours: jsonb('opening_hours').$type<{
    monday?: { open: string; close: string };
    // ... other days
  }>(),
  rating: doublePrecision('rating'),
  isPremium: boolean('is_premium').default(false),
  premiumTier: varchar('premium_tier', { length: 20 }), // 'basic', 'premium', 'featured'
  createdAt: timestamp('created_at').defaultNow(),
});
