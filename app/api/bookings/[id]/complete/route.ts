import { NextRequest, NextResponse } from 'next/server';
import { completeBooking } from '@/lib/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await completeBooking(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing booking:', error);
    return NextResponse.json({ error: 'Failed to complete booking' }, { status: 500 });
  }
}
