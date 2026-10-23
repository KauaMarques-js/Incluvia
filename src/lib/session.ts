import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import env from '@/lib/config';

export interface SessionData {
  userId: string;
  role: 'admin' | 'auditor';
  isLoggedIn: boolean;
}

const sessionOptions: SessionOptions = {
  password: env.SESSION_SECRET,
  cookieName: 'Incluvia_session',
  cookieOptions: {
    secure: env.isProduction,
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    const { AppError } = await import('@/lib/errors');
    throw new AppError('UNAUTHORIZED', 'Autenticação necessária.');
  }

  return session;
}

export async function requireAdmin(): Promise<SessionData> {
  const session = await requireAuth();

  if (session.role !== 'admin') {
    const { AppError } = await import('@/lib/errors');
    throw new AppError('FORBIDDEN', 'Acesso restrito a administradores.');
  }

  return session;
}
