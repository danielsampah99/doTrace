import { relations } from 'drizzle-orm';
import { userInteractions } from './user-interactions';
import { users } from './users';

export const usersRelations = relations(users, ({ many }) => ({
	interactions: many(userInteractions),
}));
