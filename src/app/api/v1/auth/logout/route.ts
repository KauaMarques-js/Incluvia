import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { handleApiError } from '@/lib/errors';

/**
 * POST /api/v1/auth/logout
 * Destroys the user's session.
 */
export async function POST() {
  try {
    const session = await getSession();
    session.destroy();

    return NextResponse.json({ data: { message: 'Logout realizado.' } });
  } catch (error) {
    return handleApiError(error);
  }
}
