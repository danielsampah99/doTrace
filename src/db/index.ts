import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { envVars } from '../../config/environment';

import { businessesRelations } from './schema/business-relations';
import { businessSubscriptions } from './schema/business-subsriptions';
import { businesses } from './schema/businesses';
import { geofences } from './schema/geofences';
import { userInteractions } from './schema/user-interactions';
import { usersRelations } from './schema/user-relations';
import { users } from './schema/users';

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
