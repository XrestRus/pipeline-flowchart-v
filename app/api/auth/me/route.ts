/**
 * API-маршрут для получения данных о текущем пользователе
 * Проверяет токен и возвращает информацию о пользователе
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getUserById } from '@/lib/db';

// Предотвращаем кэширование ответа
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookiesHeader = request.headers.get('cookie') || '';
    // Парсим куки
    const token = cookiesHeader
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Пользователь не авторизован' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache'
          }
        }
      );
    }
    
    // Проверяем JWT токен
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars-long');
    
    try {
      const { payload } = await jwtVerify(token, secret);
      
      // Получаем данные пользователя из базы
      const user = await getUserById(payload.userId as number);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Пользователь не найден' },
          { 
            status: 404,
            headers: {
              'Cache-Control': 'no-store, max-age=0',
              'Pragma': 'no-cache'
            }
          }
        );
      }
      
      // Возвращаем данные пользователя с заголовками для предотвращения кэширования
      return NextResponse.json(
        { user },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache'
          }
        }
      );
    } catch (error) {
      // Если токен недействителен или истек срок действия
      return NextResponse.json(
        { error: 'Недействительный токен авторизации' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache'
          }
        }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      }
    );
  }
} 