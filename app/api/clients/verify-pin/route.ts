import { NextRequest, NextResponse } from 'next/server';
import { verifyClientPin, getClient } from '@/lib/queries';

export async function POST(request: NextRequest) {
  try {
    const { clientId, pin } = await request.json();

    if (!clientId || !pin) {
      return NextResponse.json({ error: 'Client ID and PIN are required' }, { status: 400 });
    }

    const isValid = await verifyClientPin(parseInt(clientId), pin);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Return client info on successful verification
    const client = await getClient(parseInt(clientId));

    return NextResponse.json({
      success: true,
      client: {
        id: client?.id,
        name: client?.name,
        sessionsRemaining: client?.sessionsRemaining
      }
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json({ error: 'Failed to verify PIN' }, { status: 500 });
  }
}
