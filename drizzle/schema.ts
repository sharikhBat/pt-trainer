import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sessionsRemaining: integer('sessions_remaining').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  datetime: timestamp('datetime').notNull(),
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
