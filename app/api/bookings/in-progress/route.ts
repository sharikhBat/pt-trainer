import { NextResponse } from 'next/server';
import { getInProgressBookings } from '@/lib/queries';

export async function GET() {
  try {
    const bookings = await getInProgressBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching in-progress bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch in-progress bookings' }, { status: 500 });
  }
}
