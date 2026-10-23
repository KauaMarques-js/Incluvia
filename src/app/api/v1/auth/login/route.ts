import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { verifyPassword } from '@/lib/password';
import { loginSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';

/**
 * POST /api/v1/auth/login
 * Authenticates a user and creates a session.
 * Error messages do not reveal whether an email exists (RF-01).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      throw new AppError('VALIDATION_ERROR', 'Verifique os campos informados.', {
        fields: result.error.flatten().fieldErrors,
      });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
      },
    });

    // Generic error to avoid revealing if email exists
    const genericError = new AppError(
      'UNAUTHORIZED',
      'E-mail ou senha incorretos.'
    );

    if (!user) {
      throw genericError;
    }

    const validPassword = await verifyPassword(user.passwordHash, password);
    if (!validPassword) {
      throw genericError;
    }

    const session = await getSession();
    session.userId = user.id;
    session.role = user.role as 'admin' | 'auditor';
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
