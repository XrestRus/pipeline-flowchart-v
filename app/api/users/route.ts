/**
 * API-эндпоинты для работы с пользователями
 */
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

// Предотвращаем кэширование ответа
export const dynamic = 'force-dynamic';

// Функция для получения данных пользователя из токена
async function getUserFromToken(request: NextRequest) {
  try {
    // Получаем токен из cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Проверяем JWT токен
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars-long');
    const { payload } = await jwtVerify(token, secret);
    
    // Получаем данные о пользователе
    const userId = payload.userId as number;
    const role = payload.role as string;
    
    return { userId, role };
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    return null;
  }
}

// Получение списка всех пользователей (только для админов)
export async function GET(request: NextRequest) {
  try {
    // Проверяем права доступа
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не авторизован' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Недостаточно прав для выполнения операции' },
        { status: 403 }
      );
    }
    
    // Получаем список пользователей
    const users = await db.getAllUsers();
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Ошибка получения списка пользователей:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Создание нового пользователя (только для админов)
export async function POST(request: NextRequest) {
  try {
    // Проверяем права доступа
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не авторизован' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Недостаточно прав для выполнения операции' },
        { status: 403 }
      );
    }
    
    const { username, password, fullName, email, role } = await request.json();
    
    // Проверяем обязательные поля
    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Не заполнены обязательные поля' },
        { status: 400 }
      );
    }
    
    // Проверяем валидность роли
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.json(
        { error: 'Некорректная роль пользователя' },
        { status: 400 }
      );
    }
    
    // Проверяем существование пользователя
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким именем уже существует' },
        { status: 409 }
      );
    }
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создаем пользователя
    const newUser = await db.createUser(username, hashedPassword, fullName || '', email || '', role);
    
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 