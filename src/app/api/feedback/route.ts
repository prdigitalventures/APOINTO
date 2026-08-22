import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const rating = Number(body.rating);
    if (message.length < 8) {
      return NextResponse.json({ error: 'Please write a little more so we can improve the app.' }, { status: 400 });
    }
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be 1 to 5.' }, { status: 400 });
    }

    await prisma.feedback.create({
      data: {
        userId: session.id,
        message: message.slice(0, 2000),
        rating: Number.isFinite(rating) ? rating : null,
      },
    });

    await prisma.user.update({
      where: { id: session.id },
      data: { rewardPoints: { increment: 10 } },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
