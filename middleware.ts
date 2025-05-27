/**
 * Middleware для проверки авторизации пользователей
 * Проверяет наличие токена в запросах к защищенным маршрутам
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Пути, для которых не требуется авторизация
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/_next',
  '/favicon.ico',
  '/public'
];

// Функция для проверки, является ли путь публичным
function isPublicPath(path: string) {
  return publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '/')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Пропускаем публичные маршруты без проверки
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Получаем токен из cookie
  const token = request.cookies.get('auth-token')?.value;
  
  // Если токен отсутствует, перенаправляем на страницу входа
  if (!token) {
    // Для API-запросов возвращаем 401
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Необходима авторизация' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // Для остальных запросов перенаправляем на страницу входа
    const url = new URL('/login', request.url);
    url.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  try {
    // Проверяем JWT токен
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars-long');
    await jwtVerify(token, secret);
    
    // Если токен действителен, пропускаем запрос
    return NextResponse.next();
  } catch (error) {
    // Если токен недействителен, перенаправляем на страницу входа
    // Для API-запросов возвращаем 401
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Недействительный токен' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // Удаляем недействительный токен
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    
    return response;
  }
}

// Указываем, для каких путей будет применяться middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 