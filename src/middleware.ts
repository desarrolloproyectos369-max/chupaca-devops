import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

const protectedRoutes = ['/dashboard', '/expedientes', '/configuracion', '/reportes']
const publicRoutes = ['/', '/recuperar', '/seguimiento']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isPublicRoute = publicRoutes.includes(path)

  const cookie = request.cookies.get('session')?.value
  let session = null

  if (cookie) {
    try {
      session = await decrypt(cookie)
    } catch (error) {
      console.error("Token inválido o expirado")
    }
  }

  // Redirigir a login si intenta acceder a ruta protegida sin sesión
  if (isProtectedRoute && !session && !path.startsWith('/api')) {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }

  // Redirigir a dashboard si intenta acceder a login con sesión activa
  if (isPublicRoute && session && path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
  }

  // Pasar variables de sesión en los headers para fácil acceso en Server Components
  const requestHeaders = new Headers(request.headers)
  if (session) {
    requestHeaders.set('x-user-id', session.id as string)
    requestHeaders.set('x-role-id', session.rolId as string)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
