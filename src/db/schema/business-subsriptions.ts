import { pgTable, serial, varchar, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { businesses } from './businesses';


// Business subscriptions table
export const businessSubscriptions = pgTable('business_subscriptions', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').references(() => businesses.id).notNull(),
  tier: varchar('tier', { length: 20 }).notNull(),
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'),
  paymentDetails: jsonb('payment_details'),
});
