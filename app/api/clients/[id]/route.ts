import { NextRequest, NextResponse } from 'next/server';
import { getClient, updateClientSessions, updateClientPin, deleteClient } from '@/lib/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await getClient(parseInt(id));

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sessionsRemaining, pin } = body;

    // Handle PIN update
    if (pin !== undefined) {
      if (typeof pin !== 'string' || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return NextResponse.json({ error: 'PIN must be a 4-digit number' }, { status: 400 });
      }
      const client = await updateClientPin(parseInt(id), pin);
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      return NextResponse.json(client);
    }

    // Handle sessions update
    if (typeof sessionsRemaining !== 'number' || sessionsRemaining < 0) {
      return NextResponse.json({ error: 'Invalid sessions count' }, { status: 400 });
    }

    const client = await updateClientSessions(parseInt(id), sessionsRemaining);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteClient(parseInt(id));

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete client' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
