import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { envVars } from '../../config/environment';
import { config } from 'dotenv';

import { businesses } from './schema/businesses';
import { users } from './schema/users';
import { geofences } from './schema/geofences';
import { userInteractions } from './schema/user-interactions';
import { businessSubscriptions } from './schema/business-subsriptions';
import { businessesRelations } from './schema/business-relations';
import { usersRelations } from './schema/user-relations';

config({ path: '.env' });

const sql = neon(envVars.DATABASE_URL);

export const db = drizzle({
	client: sql,
	casing: 'snake_case',
	logger: true,
	schema: {
		businesses,
		users,
		userInteractions,
		usersRelations,
		geofences,
		businessesRelations,
		businessSubscriptions,
	},
});

export type Database = typeof db;
