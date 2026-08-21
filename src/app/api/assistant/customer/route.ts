import { NextRequest, NextResponse } from 'next/server';
import { customerCanBook, getSession } from '@/lib/auth';
import { handleCustomerAssistant, type AssistantProposal } from '@/lib/customer-assistant';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const emailVerified = await customerCanBook(session.id);
    const result = await handleCustomerAssistant({
      message: body.message || '',
      city: body.city,
      latitude: body.latitude,
      longitude: body.longitude,
      proposal: (body.proposal as AssistantProposal) || null,
      customerId: session.id,
      customerName: session.name,
      customerPhone: session.phone,
      confirmBooking: !!body.confirmBooking,
      emailVerified,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
