import { NextRequest, NextResponse } from 'next/server';
import { getAllClients, createClient } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePin = searchParams.get('includePin') === 'true';

    const clients = await getAllClients();

    // Only return PIN when explicitly requested (trainer view)
    if (!includePin) {
      const clientsWithoutPin = clients.map(({ pin, ...rest }) => rest);
      return NextResponse.json(clientsWithoutPin);
    }

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, sessionsRemaining, pin } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const sessions = parseInt(sessionsRemaining) || 0;
    const clientPin = pin || '0000';
    const client = await createClient(name.trim(), sessions, clientPin);

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
