import { NextResponse } from 'next/server'

// Supabase desconectado temporalmente — sin redirects de auth
export default function proxy(request) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
