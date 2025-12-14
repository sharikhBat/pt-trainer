import { NextRequest, NextResponse } from 'next/server';
import { getBlockedTimes, createBlockedTime } from '@/lib/queries';

export async function GET() {
  try {
    const blockedTimes = await getBlockedTimes();
    return NextResponse.json(blockedTimes);
  } catch (error) {
    console.error('Error fetching blocked times:', error);
    return NextResponse.json({ error: 'Failed to fetch blocked times' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { startTime, endTime, dayOfWeek } = await request.json();

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Start time and end time are required' }, { status: 400 });
    }

    const blockedTime = await createBlockedTime(startTime, endTime, dayOfWeek);
    return NextResponse.json(blockedTime, { status: 201 });
  } catch (error) {
    console.error('Error creating blocked time:', error);
    return NextResponse.json({ error: 'Failed to create blocked time' }, { status: 500 });
  }
}
