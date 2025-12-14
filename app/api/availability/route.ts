import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/queries';

export async function GET() {
  try {
    const availability = await getAvailableSlots(7);
    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
