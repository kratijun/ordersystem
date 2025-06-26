import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Pfade die nicht geschützt werden sollen
  const publicPaths = ['/login', '/']
  
  // Prüfen ob der aktuelle Pfad öffentlich ist
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path
  )
  
  // Wenn es ein öffentlicher Pfad ist, Request durchlassen
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Für Client-seitige Authentifizierung - das wird vom AuthProvider gehandhabt
  // Middleware nur für Server-seitige Routen verwenden
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*", 
    "/waiter/:path*",
    "/kitchen/:path*"
  ]
} 