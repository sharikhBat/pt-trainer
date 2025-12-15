import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/drizzle/schema';

const connectionString = process.env.DATABASE_URL!;

// Local Supabase doesn't need SSL, production does
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const sql = postgres(connectionString, isLocal ? {} : { ssl: 'require' });

export const db = drizzle(sql, { schema });
