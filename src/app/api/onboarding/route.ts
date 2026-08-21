import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  createInitialState,
  processOnboardingTurn,
  createBusinessFromOnboarding,
  type OnboardingState,
} from '@/lib/ai-onboarding';

export async function GET() {
  const session = await requireSession();
  const existing = await prisma.onboardingSession.findFirst({
    where: { userId: session.id, completed: false },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({
    session: existing ? { id: existing.id, state: JSON.parse(existing.state) } : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { message, sessionId } = await req.json();

    let dbSession = sessionId
      ? await prisma.onboardingSession.findUnique({ where: { id: sessionId } })
      : null;

    const state: OnboardingState = dbSession
      ? (JSON.parse(dbSession.state) as OnboardingState)
      : createInitialState();

    const { state: newState, response } = await processOnboardingTurn(state, message);

    if (!dbSession) {
      dbSession = await prisma.onboardingSession.create({
        data: { userId: session.id, state: JSON.stringify(newState) },
      });
    } else {
      await prisma.onboardingSession.update({
        where: { id: dbSession.id },
        data: { state: JSON.stringify(newState) },
      });
    }

    let business = null;
    if (newState.step === 'complete') {
      business = await createBusinessFromOnboarding(session.id, newState);
      await prisma.onboardingSession.update({
        where: { id: dbSession.id },
        data: { completed: true, state: JSON.stringify(newState) },
      });
      await prisma.user.update({
        where: { id: session.id },
        data: { role: 'OWNER' },
      });
    }

    return NextResponse.json({
      sessionId: dbSession.id,
      response,
      state: newState,
      business: business ? { id: business.id, slug: business.slug, name: business.name } : null,
      complete: newState.step === 'complete',
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
