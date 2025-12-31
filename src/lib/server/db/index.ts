import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// For Cloudflare Workers / serverless: create db client per request
export function createDb(databaseUrl: string) {
	const sql = neon(databaseUrl);
	return drizzle(sql, { schema });
}

// Type export for use in routes
export type Database = ReturnType<typeof createDb>;
