import { NextRequest, NextResponse } from 'next/server';
import { getAllClients, createClient } from '@/lib/queries';

export async function GET() {
  try {
    const clients = await getAllClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, sessionsRemaining } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const sessions = parseInt(sessionsRemaining) || 0;
    const client = await createClient(name.trim(), sessions);

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
