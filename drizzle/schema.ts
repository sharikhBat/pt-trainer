import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  pin: text('pin').notNull().default('0000'),
  sessionsRemaining: integer('sessions_remaining').notNull().default(0),
  sessionsExpiresAt: text('sessions_expires_at'), // "YYYY-MM-DD" format, null means no expiry
  createdAt: timestamp('created_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  date: text('date').notNull(),        // "2025-12-15" format (IST date)
  hour: integer('hour').notNull(),     // 0-23, e.g., 21 for 9pm IST
  status: text('status').notNull().default('upcoming'), // upcoming, completed, cancelled
  createdAt: timestamp('created_at').defaultNow(),
});

export const blockedTimes = pgTable('blocked_times', {
  id: serial('id').primaryKey(),
  startTime: text('start_time').notNull(), // "05:00" format
  endTime: text('end_time').notNull(),     // "10:00" format
  dayOfWeek: integer('day_of_week'),       // 0-6, null means every day
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports for use in queries
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BlockedTime = typeof blockedTimes.$inferSelect;
