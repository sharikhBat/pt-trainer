import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Migration script to convert bookings table from datetime to date + hour
 *
 * This script:
 * 1. Adds new 'date' (text) and 'hour' (integer) columns
 * 2. Migrates existing data from datetime to date + hour
 * 3. Drops the old datetime column
 *
 * Run with: npx tsx drizzle/migrate-to-date-hour.ts
 */

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }

  console.log('=== MIGRATION: datetime -> date + hour ===\n');
  console.log('Connecting to database...');

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const sql = postgres(connectionString, isLocal ? {} : { ssl: 'require' });

  try {
    // Step 1: Check current schema
    console.log('\n1. Checking current schema...');
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `;
    console.log('Current columns:', columns.map(c => `${c.column_name} (${c.data_type})`).join(', '));

    const hasDatetime = columns.some(c => c.column_name === 'datetime');
    const hasDate = columns.some(c => c.column_name === 'date');
    const hasHour = columns.some(c => c.column_name === 'hour');

    if (!hasDatetime && hasDate && hasHour) {
      console.log('\n✓ Migration already complete! Schema is up to date.');
      await sql.end();
      return;
    }

    if (!hasDatetime) {
      console.log('\n✗ Error: datetime column not found. Cannot migrate.');
      await sql.end();
      return;
    }

    // Step 2: Get existing bookings before migration
    console.log('\n2. Fetching existing bookings...');
    const existingBookings = await sql`
      SELECT id, datetime::text as datetime_raw, EXTRACT(HOUR FROM datetime) as db_hour
      FROM bookings
      ORDER BY id
    `;
    console.log(`Found ${existingBookings.length} bookings to migrate`);

    // Step 3: Add new columns if they don't exist
    console.log('\n3. Adding new columns...');

    if (!hasDate) {
      await sql`ALTER TABLE bookings ADD COLUMN date TEXT`;
      console.log('   ✓ Added "date" column');
    } else {
      console.log('   - "date" column already exists');
    }

    if (!hasHour) {
      await sql`ALTER TABLE bookings ADD COLUMN hour INTEGER`;
      console.log('   ✓ Added "hour" column');
    } else {
      console.log('   - "hour" column already exists');
    }

    // Step 4: Migrate data
    // The datetime column stores UTC times. We need to convert to IST (add 5:30)
    // Since bookings were created by IST users, the original hour they selected
    // needs to be recovered: UTC hour + 5.5 = IST hour
    console.log('\n4. Migrating data from datetime to date + hour...');
    console.log('   (Converting UTC stored times to IST hours)');

    await sql`
      UPDATE bookings
      SET
        date = TO_CHAR(datetime + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD'),
        hour = EXTRACT(HOUR FROM datetime + INTERVAL '5 hours 30 minutes')::INTEGER
      WHERE date IS NULL OR hour IS NULL
    `;
    console.log('   ✓ Data migrated');

    // Step 5: Verify migration
    console.log('\n5. Verifying migration...');
    const migratedBookings = await sql`
      SELECT id, date, hour, datetime::text as old_datetime
      FROM bookings
      ORDER BY id
    `;

    console.log('\nMigrated bookings:');
    for (const b of migratedBookings) {
      const displayHour = b.hour > 12 ? b.hour - 12 : b.hour === 0 ? 12 : b.hour;
      const ampm = b.hour >= 12 ? 'PM' : 'AM';
      console.log(`   ID ${b.id}: ${b.date} at ${displayHour}:00 ${ampm} (was: ${b.old_datetime})`);
    }

    // Step 6: Set NOT NULL constraints
    console.log('\n6. Setting NOT NULL constraints...');
    await sql`ALTER TABLE bookings ALTER COLUMN date SET NOT NULL`;
    await sql`ALTER TABLE bookings ALTER COLUMN hour SET NOT NULL`;
    console.log('   ✓ Constraints set');

    // Step 7: Drop old datetime column
    console.log('\n7. Dropping old datetime column...');
    await sql`ALTER TABLE bookings DROP COLUMN datetime`;
    console.log('   ✓ Old column dropped');

    // Final verification
    console.log('\n8. Final schema:');
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `;
    for (const c of finalColumns) {
      console.log(`   - ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    }

    console.log('\n=== MIGRATION COMPLETE ===\n');

  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

migrate().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
