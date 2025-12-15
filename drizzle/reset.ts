import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { blockedTimes, clients, bookings } from './schema';
import { sql as drizzleSql } from 'drizzle-orm';

async function reset() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const connectionString = process.env.DATABASE_URL;
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const sql = postgres(connectionString, isLocal ? {} : { ssl: 'require' });
  const db = drizzle(sql);

  console.log('Resetting database...');

  // Delete all data in order (respecting foreign keys)
  console.log('Clearing bookings...');
  await db.delete(bookings);

  console.log('Clearing clients...');
  await db.delete(clients);

  console.log('Clearing blocked times...');
  await db.delete(blockedTimes);

  // Reset sequences
  console.log('Resetting sequences...');
  await sql`ALTER SEQUENCE bookings_id_seq RESTART WITH 1`;
  await sql`ALTER SEQUENCE clients_id_seq RESTART WITH 1`;
  await sql`ALTER SEQUENCE blocked_times_id_seq RESTART WITH 1`;

  console.log('✓ All data cleared');

  // Re-seed blocked times
  const blockedTimeData = [
    { startTime: '05:00', endTime: '10:00', dayOfWeek: null },
    { startTime: '18:00', endTime: '21:00', dayOfWeek: null },
  ];

  for (const block of blockedTimeData) {
    await db.insert(blockedTimes).values(block);
  }
  console.log('✓ Blocked times seeded');

  // Re-seed demo clients (all PINs set to 1234)
  const demoClients = [
    { name: 'Sharikh', sessionsRemaining: 24, pin: '1234' },
    { name: 'Riyan', sessionsRemaining: 0, pin: '1234' },
    { name: 'Tannu', sessionsRemaining: 2, pin: '1234' },
  ];

  for (const client of demoClients) {
    await db.insert(clients).values(client);
  }
  console.log('✓ Demo clients seeded');

  console.log('Database reset complete!');
  await sql.end();
}

reset()
  .catch((error) => {
    console.error('Error resetting database:', error);
    process.exit(1);
  });
