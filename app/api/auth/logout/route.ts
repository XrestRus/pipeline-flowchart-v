/**
 * API-маршрут для выхода из системы
 * Удаляет куки с токеном авторизации
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Создаем ответ
    const response = NextResponse.json({ 
      success: true,
      message: 'Выход выполнен успешно' 
    });
    
    // Удаляем cookie с токеном
    response.cookies.delete('auth-token');
    
    return response;
  } catch (error) {
    console.error('Ошибка при выходе из системы:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 