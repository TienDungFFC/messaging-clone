import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Danh sách các đường dẫn không cần xác thực
const publicPaths = ['/', '/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  // Lấy token từ cookies
  const token = request.cookies.get('auth-token');
  const isAuthenticated = !!token;
  const path = request.nextUrl.pathname;

  // Kiểm tra xem đường dẫn có phải là public không
  const isPublicPath = publicPaths.includes(path) || 
                      path.startsWith('/api/') || 
                      path.includes('.');

  // Nếu không có token và đường dẫn không phải public, chuyển hướng đến trang đăng nhập
  if (!isAuthenticated && !isPublicPath) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Nếu đã xác thực và đang truy cập trang đăng nhập hoặc đăng ký, chuyển hướng đến dashboard
  if (isAuthenticated && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Chỉ định các đường dẫn cần áp dụng middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
