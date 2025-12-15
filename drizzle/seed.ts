import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { blockedTimes, clients } from './schema';

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const connectionString = process.env.DATABASE_URL;
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const sql = postgres(connectionString, isLocal ? {} : { ssl: 'require' });
  const db = drizzle(sql);

  console.log('Seeding database...');

  // Seed blocked times (default training hours)
  const blockedTimeData = [
    { startTime: '05:00', endTime: '10:00', dayOfWeek: null }, // Morning group training (every day)
    { startTime: '18:00', endTime: '21:00', dayOfWeek: null }, // Evening group training (every day)
  ];

  for (const block of blockedTimeData) {
    await db.insert(blockedTimes).values(block);
  }

  console.log('✓ Blocked times seeded');

  // Optional: Seed some demo clients (all PINs set to 1234)
  const demoClients = [
    { name: 'Sharikh', sessionsRemaining: 24, pin: '1234' },
    { name: 'Riyan', sessionsRemaining: 0, pin: '1234' },
    { name: 'Tannu', sessionsRemaining: 2, pin: '1234' },
  ];

  for (const client of demoClients) {
    await db.insert(clients).values(client);
  }

  console.log('✓ Demo clients seeded');
  console.log('Database seeding complete!');

  // Close the connection
  await sql.end();
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
