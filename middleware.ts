import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('MIDDLEWARE PATH:', pathname);
  if (pathname.startsWith('/_') || process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.next();
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
