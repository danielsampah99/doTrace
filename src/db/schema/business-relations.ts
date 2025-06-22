import { relations } from 'drizzle-orm';
import { businessSubscriptions } from './business-subsriptions';
import { businesses } from './businesses';
import { userInteractions } from './user-interactions';

export const businessesRelations = relations(businesses, ({ many }) => ({
	interactions: many(userInteractions),
	subscriptions: many(businessSubscriptions),
}));
