import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { clients, bookings } from './schema';

async function seedTestBookings() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const connectionString = process.env.DATABASE_URL;
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const sql = postgres(connectionString, isLocal ? {} : { ssl: 'require' });
  const db = drizzle(sql);

  console.log('Adding test bookings...');

  // Find Shariq's client ID
  const shariqResults = await db.select().from(clients).where(eq(clients.name, 'Shariq'));

  if (shariqResults.length === 0) {
    console.log('Shariq not found, creating...');
    const newClient = await db.insert(clients).values({ name: 'Shariq', sessionsRemaining: 12 }).returning();
    shariqResults.push(newClient[0]);
  }

  const shariq = shariqResults[0];
  console.log(`Found Shariq with ID: ${shariq.id}`);

  // Get today's date string
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Insert bookings for 5pm and 6pm
  const booking1 = await db.insert(bookings).values({
    clientId: shariq.id,
    date: todayStr,
    hour: 17, // 5pm
    status: 'upcoming',
  }).returning();
  console.log(`✓ Created 5pm booking: ${booking1[0].id}`);

  const booking2 = await db.insert(bookings).values({
    clientId: shariq.id,
    date: todayStr,
    hour: 18, // 6pm
    status: 'upcoming',
  }).returning();
  console.log(`✓ Created 6pm booking: ${booking2[0].id}`);

  console.log('Test bookings created!');
  console.log(`\nBookings for ${todayStr}:`);
  console.log(`- 5:00 PM with Shariq`);
  console.log(`- 6:00 PM with Shariq`);

  await sql.end();
}

seedTestBookings()
  .catch((error) => {
    console.error('Error creating test bookings:', error);
    process.exit(1);
  });
