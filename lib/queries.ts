import { db } from './db';
import { clients, bookings, blockedTimes, type Client, type Booking, type BlockedTime } from '@/drizzle/schema';
import { eq, and, gte, lt, or, sql, asc, desc } from 'drizzle-orm';

// ============ HELPERS ============

// Get today's date string in YYYY-MM-DD format (IST)
export function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Get current hour (0-23) in IST
export function getCurrentHour(): number {
  return new Date().getHours();
}

// Get date string for N days from now
export function getDateStr(daysFromNow: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Check if a date+hour is in the past
export function isSlotInPast(date: string, hour: number): boolean {
  const today = getTodayDateStr();
  const currentHour = getCurrentHour();

  if (date < today) return true;
  if (date === today && hour <= currentHour) return true;
  return false;
}

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
    await db.transaction(async (tx) => {
      await tx.delete(bookings).where(eq(bookings.clientId, id));
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
    .orderBy(asc(bookings.date), asc(bookings.hour));
}

export async function getUpcomingBookings(): Promise<(Booking & { clientName: string; clientSessions: number })[]> {
  const result = await db.select({
    id: bookings.id,
    clientId: bookings.clientId,
    date: bookings.date,
    hour: bookings.hour,
    status: bookings.status,
    createdAt: bookings.createdAt,
    clientName: clients.name,
    clientSessions: clients.sessionsRemaining,
  })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(eq(bookings.status, 'upcoming'))
    .orderBy(asc(bookings.date), asc(bookings.hour));
  return result;
}

export async function getUpcomingAndTodayCompletedBookings(): Promise<(Booking & { clientName: string; clientSessions: number })[]> {
  const today = getTodayDateStr();

  // Get upcoming bookings
  const upcoming = await db.select({
    id: bookings.id,
    clientId: bookings.clientId,
    date: bookings.date,
    hour: bookings.hour,
    status: bookings.status,
    createdAt: bookings.createdAt,
    clientName: clients.name,
    clientSessions: clients.sessionsRemaining,
  })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(eq(bookings.status, 'upcoming'))
    .orderBy(asc(bookings.date), asc(bookings.hour));

  // Get today's completed bookings
  const todayCompleted = await db.select({
    id: bookings.id,
    clientId: bookings.clientId,
    date: bookings.date,
    hour: bookings.hour,
    status: bookings.status,
    createdAt: bookings.createdAt,
    clientName: clients.name,
    clientSessions: clients.sessionsRemaining,
  })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(
      eq(bookings.status, 'completed'),
      eq(bookings.date, today)
    ))
    .orderBy(asc(bookings.hour));

  // Get today's cancelled bookings
  const todayCancelled = await db.select({
    id: bookings.id,
    clientId: bookings.clientId,
    date: bookings.date,
    hour: bookings.hour,
    status: bookings.status,
    createdAt: bookings.createdAt,
    clientName: clients.name,
    clientSessions: clients.sessionsRemaining,
  })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(
      eq(bookings.status, 'cancelled'),
      eq(bookings.date, today)
    ))
    .orderBy(asc(bookings.hour));

  // Combine and sort by date then hour
  return [...upcoming, ...todayCompleted, ...todayCancelled].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.hour - b.hour;
  });
}

export async function createBooking(clientId: number, date: string, hour: number): Promise<Booking> {
  const result = await db.insert(bookings).values({ clientId, date, hour }).returning();
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
    await db.transaction(async (tx) => {
      const booking = await tx.select().from(bookings).where(eq(bookings.id, id));
      if (booking.length === 0) {
        throw new Error('Booking not found');
      }

      if (booking[0].status === 'completed') {
        throw new Error('Booking already completed');
      }

      await tx.update(bookings).set({ status: 'completed' }).where(eq(bookings.id, id));

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
  const today = getTodayDateStr();
  const currentHour = getCurrentHour();

  // A booking is "in progress" if it started within the last hour
  // i.e., booking hour is currentHour or currentHour - 1 (if within same day)
  const result = await db.select({
    id: bookings.id,
    clientId: bookings.clientId,
    date: bookings.date,
    hour: bookings.hour,
    status: bookings.status,
    createdAt: bookings.createdAt,
    clientName: clients.name,
  })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(
      eq(bookings.status, 'upcoming'),
      eq(bookings.date, today),
      gte(bookings.hour, currentHour - 1),
      lt(bookings.hour, currentHour + 1)
    ))
    .orderBy(asc(bookings.hour));

  // Filter to only include bookings that have started (hour <= currentHour)
  return result.filter(b => b.hour <= currentHour);
}

export async function completeExpiredBookings(): Promise<number> {
  const today = getTodayDateStr();
  const currentHour = getCurrentHour();

  // Get expired bookings: past dates OR today with hour < currentHour
  const expiredBookings = await db.select()
    .from(bookings)
    .where(and(
      eq(bookings.status, 'upcoming'),
      or(
        lt(bookings.date, today),
        and(eq(bookings.date, today), lt(bookings.hour, currentHour))
      )
    ));

  if (expiredBookings.length === 0) return 0;

  // Update bookings to completed
  await db.update(bookings)
    .set({ status: 'completed' })
    .where(and(
      eq(bookings.status, 'upcoming'),
      or(
        lt(bookings.date, today),
        and(eq(bookings.date, today), lt(bookings.hour, currentHour))
      )
    ));

  // Decrement sessions for each client
  for (const booking of expiredBookings) {
    await db.update(clients)
      .set({ sessionsRemaining: sql`GREATEST(${clients.sessionsRemaining} - 1, 0)` })
      .where(eq(clients.id, booking.clientId));
  }

  return expiredBookings.length;
}

export async function getBookingsInDateRange(startDate: string, endDate: string): Promise<Booking[]> {
  return db.select()
    .from(bookings)
    .where(and(
      gte(bookings.date, startDate),
      lt(bookings.date, endDate),
      eq(bookings.status, 'upcoming')
    ))
    .orderBy(asc(bookings.date), asc(bookings.hour));
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
function isHourBlocked(hour: number): boolean {
  // Morning blocked: 6am to 11am (hours 6-11 inclusive)
  if (hour >= 6 && hour <= 11) return true;
  // Evening blocked: 5pm to 8pm (hours 17-20 inclusive)
  if (hour >= 17 && hour <= 20) return true;
  return false;
}

export async function getAllSlotsWithStatus(days: number = 7): Promise<DayAvailability[]> {
  const today = getTodayDateStr();
  const currentHour = getCurrentHour();
  const endDate = getDateStr(days);

  // Get all upcoming bookings in the date range
  const existingBookings = await db.select()
    .from(bookings)
    .where(and(
      gte(bookings.date, today),
      lt(bookings.date, endDate),
      eq(bookings.status, 'upcoming')
    ));

  // Create a set of booked slot keys (date_hour)
  const bookedSlots = new Set(
    existingBookings.map(b => `${b.date}_${b.hour}`)
  );

  const availability: DayAvailability[] = [];
  const workingHours = { start: 6, end: 22 }; // 6 AM to 10 PM (last slot at 9pm/21:00)

  for (let d = 0; d < days; d++) {
    const dateStr = getDateStr(d);
    const slots: SlotWithStatus[] = [];

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      const slotKey = `${dateStr}_${hour}`;

      let status: SlotStatus;

      // Check if in the past
      if (dateStr < today || (dateStr === today && hour <= currentHour)) {
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
export async function hasClientBookingOnDate(clientId: number, date: string): Promise<boolean> {
  const existing = await db.select()
    .from(bookings)
    .where(and(
      eq(bookings.clientId, clientId),
      eq(bookings.status, 'upcoming'),
      eq(bookings.date, date)
    ));

  return existing.length > 0;
}

// Check if slot is already booked by anyone
export async function isSlotBooked(date: string, hour: number): Promise<boolean> {
  const existing = await db.select()
    .from(bookings)
    .where(and(
      eq(bookings.date, date),
      eq(bookings.hour, hour),
      eq(bookings.status, 'upcoming')
    ));

  return existing.length > 0;
}
