import { relations } from 'drizzle-orm';
import { users } from './users';
import { userInteractions } from './user-interactions';



export const usersRelations = relations(users, ({ many }) => ({
  interactions: many(userInteractions),
}));
