import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'Incluvia_session';

/**
 * Leva visitantes sem sessão para o login, preservando a página de destino.
 * É só uma conveniência de navegação: a autorização real continua na API (§13.2).
 */
export function middleware(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  const destination = request.nextUrl.pathname + request.nextUrl.search;
  if (destination !== '/') loginUrl.searchParams.set('next', destination);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api|login|_next|favicon.ico).*)'],
};
