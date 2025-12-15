import { db } from './db';
import { clients, bookings, blockedTimes, type Client, type Booking, type BlockedTime } from '@/drizzle/schema';
import { eq, and, gte, lt, sql } from 'drizzle-orm';

// ============ CLIENTS ============

export async function getAllClients(): Promise<Client[]> {
  return db.select().from(clients).orderBy(clients.name);
}

export async function getClient(id: number): Promise<Client | undefined> {
  const result = await db.select().from(clients).where(eq(clients.id, id));
  return result[0];
}

export async function createClient(name: string, sessionsRemaining: number, pin: string = '0000'): Promise<Client> {
  const result = await db.insert(clients).values({ name, sessionsRemaining, pin }).returning();
  return result[0];
}

export async function verifyClientPin(clientId: number, pin: string): Promise<boolean> {
  const result = await db.select({ pin: clients.pin }).from(clients).where(eq(clients.id, clientId));
  if (result.length === 0) return false;
  return result[0].pin === pin;
}

export async function updateClientPin(id: number, pin: string): Promise<Client | undefined> {
  const result = await db.update(clients)
    .set({ pin })
    .where(eq(clients.id, id))
    .returning();
  return result[0];
}

export async function updateClientSessions(id: number, sessionsRemaining: number): Promise<Client | undefined> {
  const result = await db.update(clients)
    .set({ sessionsRemaining })
    .where(eq(clients.id, id))
    .returning();
  return result[0];
}

export async function deleteClient(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Use a transaction to delete client and their bookings together
    await db.transaction(async (tx) => {
      // First delete all bookings for this client
      await tx.delete(bookings).where(eq(bookings.clientId, id));
      // Then delete the client
      await tx.delete(clients).where(eq(clients.id, id));
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting client:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete client'
    };
  }
}

// ============ BOOKINGS ============

export async function getClientBookings(clientId: number): Promise<Booking[]> {
  return db.select()
    .from(bookings)
    .where(and(eq(bookings.clientId, clientId), eq(bookings.status, 'upcoming')))
    .orderBy(bookings.datetime);
}

export async function getUpcomingBookings(): Promise<(Booking & { clientName: string; clientSessions: number })[]> {
  const result = await db.select({
    id: bookings.id,
    clientId: bookings.clientId,
    datetime: bookings.datetime,
    status: bookings.status,
    createdAt: bookings.createdAt,
    clientName: clients.name,
    clientSessions: clients.sessionsRemaining,
  })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(eq(bookings.status, 'upcoming'))
    .orderBy(bookings.datetime);
  return result;
}

export async function getUpcomingAndTodayCompletedBookings(): Promise<(Booking & { clientName: string; clientSessions: number })[]> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // Get upcoming bookings
  const upcoming = await db.select({
    id: bookings.id,
    clientId: bookings.clientId,
    datetime: bookings.datetime,
    status: bookings.status,
    createdAt: bookings.createdAt,
    clientName: clients.name,
    clientSessions: clients.sessionsRemaining,
  })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(eq(bookings.status, 'upcoming'))
    .orderBy(bookings.datetime);

  // Get today's completed bookings
  const todayCompleted = await db.select({
    id: bookings.id,
    clientId: bookings.clientId,
    datetime: bookings.datetime,
    status: bookings.status,
    createdAt: bookings.createdAt,
    clientName: clients.name,
    clientSessions: clients.sessionsRemaining,
  })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(
      eq(bookings.status, 'completed'),
      gte(bookings.datetime, startOfToday),
      lt(bookings.datetime, endOfToday)
    ))
    .orderBy(bookings.datetime);

  // Get today's cancelled bookings
  const todayCancelled = await db.select({
    id: bookings.id,
    clientId: bookings.clientId,
    datetime: bookings.datetime,
    status: bookings.status,
    createdAt: bookings.createdAt,
    clientName: clients.name,
    clientSessions: clients.sessionsRemaining,
  })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(
      eq(bookings.status, 'cancelled'),
      gte(bookings.datetime, startOfToday),
      lt(bookings.datetime, endOfToday)
    ))
    .orderBy(bookings.datetime);

  // Combine and sort by datetime
  return [...upcoming, ...todayCompleted, ...todayCancelled].sort((a, b) =>
    new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
}

export async function createBooking(clientId: number, datetime: Date): Promise<Booking> {
  const result = await db.insert(bookings).values({ clientId, datetime }).returning();
  return result[0];
}

export async function cancelBooking(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db.update(bookings)
      .set({ status: 'cancelled' })
      .where(eq(bookings.id, id))
      .returning();

    if (result.length === 0) {
      return { success: false, error: 'Booking not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel booking'
    };
  }
}

export async function completeBooking(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Use a transaction to ensure both operations succeed or both fail
    await db.transaction(async (tx) => {
      // Get the booking to find the client
      const booking = await tx.select().from(bookings).where(eq(bookings.id, id));
      if (booking.length === 0) {
        throw new Error('Booking not found');
      }

      if (booking[0].status === 'completed') {
        throw new Error('Booking already completed');
      }

      // Mark as completed
      await tx.update(bookings).set({ status: 'completed' }).where(eq(bookings.id, id));

      // Deduct session from client
      await tx.update(clients)
        .set({ sessionsRemaining: sql`GREATEST(${clients.sessionsRemaining} - 1, 0)` })
        .where(eq(clients.id, booking[0].clientId));
    });

    return { success: true };
  } catch (error) {
    console.error('Error completing booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete booking'
    };
  }
}

export async function getInProgressBookings(): Promise<(Booking & { clientName: string })[]> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Get bookings that started within the last hour (in progress or just ended)
  const result = await db.select({
    id: bookings.id,
    clientId: bookings.clientId,
    datetime: bookings.datetime,
    status: bookings.status,
    createdAt: bookings.createdAt,
    clientName: clients.name,
  })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(
      eq(bookings.status, 'upcoming'),
      gte(bookings.datetime, oneHourAgo),
      lt(bookings.datetime, now)
    ))
    .orderBy(bookings.datetime);

  return result;
}

export async function completeExpiredBookings(): Promise<number> {
  const now = new Date();

  // Get expired bookings with client info
  const expiredBookings = await db.select()
    .from(bookings)
    .where(and(
      eq(bookings.status, 'upcoming'),
      lt(bookings.datetime, now)
    ));

  if (expiredBookings.length === 0) return 0;

  // Update bookings to completed
  await db.update(bookings)
    .set({ status: 'completed' })
    .where(and(
      eq(bookings.status, 'upcoming'),
      lt(bookings.datetime, now)
    ));

  // Decrement sessions for each client
  for (const booking of expiredBookings) {
    await db.update(clients)
      .set({ sessionsRemaining: sql`GREATEST(${clients.sessionsRemaining} - 1, 0)` })
      .where(eq(clients.id, booking.clientId));
  }

  return expiredBookings.length;
}

export async function getBookingsInRange(start: Date, end: Date): Promise<Booking[]> {
  return db.select()
    .from(bookings)
    .where(and(
      gte(bookings.datetime, start),
      lt(bookings.datetime, end),
      eq(bookings.status, 'upcoming')
    ));
}

// ============ BLOCKED TIMES ============

export async function getBlockedTimes(): Promise<BlockedTime[]> {
  return db.select().from(blockedTimes);
}

export async function createBlockedTime(startTime: string, endTime: string, dayOfWeek?: number): Promise<BlockedTime> {
  const result = await db.insert(blockedTimes).values({ startTime, endTime, dayOfWeek }).returning();
  return result[0];
}

// ============ AVAILABILITY ============

export type SlotStatus = 'available' | 'booked' | 'blocked' | 'past';

export interface SlotWithStatus {
  time: string;
  status: SlotStatus;
}

export interface DayAvailability {
  date: string;
  slots: SlotWithStatus[];
}

// Define blocked time ranges (hours where booking is not allowed)
// 6am-11am (hours 6-11): blocked
// 12pm-4pm (hours 12-16): available (unless booked)
// 5pm-8pm (hours 17-20): blocked
// 9pm (hour 21): available (unless booked)
function isHourBlocked(hour: number): boolean {
  // Morning blocked: 6am to 11am (hours 6-11 inclusive)
  if (hour >= 6 && hour <= 11) return true;
  // Evening blocked: 5pm to 8pm (hours 17-20 inclusive)
  if (hour >= 17 && hour <= 20) return true;
  return false;
}

export async function getAllSlotsWithStatus(days: number = 7): Promise<DayAvailability[]> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const existingBookings = await getBookingsInRange(now, futureDate);

  // Create a set of booked slot keys (date + hour)
  const bookedSlots = new Set(
    existingBookings.map(b => {
      const d = new Date(b.datetime);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}_${d.getHours()}`;
    })
  );

  const availability: DayAvailability[] = [];
  const workingHours = { start: 6, end: 22 }; // 6 AM to 10 PM (last slot at 9pm/21:00)

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    date.setHours(0, 0, 0, 0);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const slots: SlotWithStatus[] = [];

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, 0, 0, 0);

      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      const slotKey = `${dateStr}_${hour}`;

      let status: SlotStatus;

      // Check if in the past
      if (slotTime.getTime() <= now.getTime()) {
        status = 'past';
      }
      // Check if hour is in blocked time range
      else if (isHourBlocked(hour)) {
        status = 'blocked';
      }
      // Check if already booked by anyone
      else if (bookedSlots.has(slotKey)) {
        status = 'booked';
      }
      // Otherwise available
      else {
        status = 'available';
      }

      slots.push({ time: timeStr, status });
    }

    availability.push({ date: dateStr, slots });
  }

  return availability;
}

// Keep the old function for backwards compatibility if needed elsewhere
export async function getAvailableSlots(days: number = 7): Promise<{ date: string; slots: string[] }[]> {
  const allSlots = await getAllSlotsWithStatus(days);
  return allSlots.map(day => ({
    date: day.date,
    slots: day.slots.filter(s => s.status === 'available').map(s => s.time)
  }));
}

// Check if client already has a booking on a given date
export async function hasClientBookingOnDate(clientId: number, date: Date): Promise<boolean> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await db.select()
    .from(bookings)
    .where(and(
      eq(bookings.clientId, clientId),
      eq(bookings.status, 'upcoming'),
      gte(bookings.datetime, startOfDay),
      lt(bookings.datetime, endOfDay)
    ));

  return existing.length > 0;
}

// Check if slot is already booked by anyone
export async function isSlotBooked(datetime: Date): Promise<boolean> {
  const existing = await db.select()
    .from(bookings)
    .where(and(
      eq(bookings.datetime, datetime),
      eq(bookings.status, 'upcoming')
    ));

  return existing.length > 0;
}
