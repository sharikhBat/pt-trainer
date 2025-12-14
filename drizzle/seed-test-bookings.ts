import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { clients, bookings } from './schema';

async function seedTestBookings() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
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

  // Create bookings for today at 5pm and 6pm
  const today = new Date();

  // 5pm today
  const fivePM = new Date(today);
  fivePM.setHours(17, 0, 0, 0);

  // 6pm today
  const sixPM = new Date(today);
  sixPM.setHours(18, 0, 0, 0);

  // Insert bookings
  const booking1 = await db.insert(bookings).values({
    clientId: shariq.id,
    datetime: fivePM,
    status: 'upcoming',
  }).returning();
  console.log(`✓ Created 5pm booking: ${booking1[0].id}`);

  const booking2 = await db.insert(bookings).values({
    clientId: shariq.id,
    datetime: sixPM,
    status: 'upcoming',
  }).returning();
  console.log(`✓ Created 6pm booking: ${booking2[0].id}`);

  console.log('Test bookings created!');
  console.log(`\nBookings for ${today.toDateString()}:`);
  console.log(`- 5:00 PM with Shariq`);
  console.log(`- 6:00 PM with Shariq`);

  await sql.end();
}

seedTestBookings()
  .catch((error) => {
    console.error('Error creating test bookings:', error);
    process.exit(1);
  });
