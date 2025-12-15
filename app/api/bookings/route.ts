import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingAndTodayCompletedBookings, getClientBookings, createBooking } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      const numId = parseInt(clientId);
      if (isNaN(numId)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
      }
      const bookings = await getClientBookings(numId);
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

    const numClientId = parseInt(clientId);
    if (isNaN(numClientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const booking = await createBooking(numClientId, date, hour);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
