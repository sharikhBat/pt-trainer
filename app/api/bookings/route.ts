import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingAndTodayCompletedBookings, getClientBookings, createBooking, isSlotBooked, hasClientBookingOnDate } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      const bookings = await getClientBookings(parseInt(clientId));
      return NextResponse.json(bookings);
    }

    const bookings = await getUpcomingAndTodayCompletedBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, date, hour } = await request.json();

    if (!clientId || !date || hour === undefined) {
      return NextResponse.json({ error: 'Client ID, date, and hour are required' }, { status: 400 });
    }

    // Check if the slot is already booked by anyone
    const slotTaken = await isSlotBooked(date, hour);
    if (slotTaken) {
      return NextResponse.json({ error: 'This slot is no longer available' }, { status: 409 });
    }

    // Check if client already has a booking on this day
    const hasBookingToday = await hasClientBookingOnDate(parseInt(clientId), date);
    if (hasBookingToday) {
      return NextResponse.json({ error: 'You already have a session booked for this day' }, { status: 409 });
    }

    const booking = await createBooking(parseInt(clientId), date, hour);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
