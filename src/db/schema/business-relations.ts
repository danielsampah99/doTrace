import { relations } from 'drizzle-orm';
import { businesses } from './businesses';
import { userInteractions } from './user-interactions';
import { businessSubscriptions } from './business-subsriptions';

export const businessesRelations = relations(businesses, ({ many }) => ({
  interactions: many(userInteractions),
  subscriptions: many(businessSubscriptions),
}));
