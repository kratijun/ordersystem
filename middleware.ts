import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Middleware-Logik hier (falls benötigt)
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/orders/:path*",
    "/api/products/:path*",
    "/api/tables/:path*",
    "/api/users/:path*",
    "/api/export/:path*"
  ]
} 