import { NextRequest, NextResponse } from 'next/server';
import { completeBooking } from '@/lib/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await completeBooking(parseInt(id));

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to complete booking' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing booking:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Session may not have been marked complete.' },
      { status: 500 }
    );
  }
}
