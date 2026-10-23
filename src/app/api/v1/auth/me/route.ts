import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 */
export async function GET() {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      const { AppError } = await import('@/lib/errors');
      throw new AppError('NOT_FOUND', 'Usuário não encontrado.');
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    return handleApiError(error);
  }
}
