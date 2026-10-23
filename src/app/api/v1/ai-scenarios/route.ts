import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { handleApiError } from '@/lib/errors';
import { AI_SCENARIOS } from '@/lib/ai-scenarios';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth();
    return NextResponse.json({ data: AI_SCENARIOS });
  } catch (error) {
    return handleApiError(error);
  }
}
