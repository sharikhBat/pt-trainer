import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/drizzle/schema';

// Generic postgres connection - works with Neon, Supabase, or any Postgres
const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { ssl: 'require' });
export const db = drizzle(sql, { schema });
