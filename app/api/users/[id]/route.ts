/**
 * API-эндпоинты для работы с конкретным пользователем
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

// Получение информации о пользователе по ID (только для админов)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Некорректный ID пользователя' },
        { status: 400 }
      );
    }
    
    // Получаем данные пользователя
    const userData = await db.getUserById(userId);
    
    if (!userData) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error(`Ошибка получения данных пользователя ID=${params.id}:`, error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Обновление данных пользователя (только для админов)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Некорректный ID пользователя' },
        { status: 400 }
      );
    }
    
    const { fullName, email, role, isActive, password } = await request.json();
    
    // Проверяем существование пользователя
    const existingUser = await db.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }
    
    // Проверяем валидность роли
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.json(
        { error: 'Некорректная роль пользователя' },
        { status: 400 }
      );
    }
    
    // Обновляем базовую информацию пользователя
    const updatedUser = await db.updateUser(
      userId,
      fullName || existingUser.full_name,
      email || existingUser.email,
      role || existingUser.role,
      isActive !== undefined ? isActive : existingUser.is_active
    );
    
    // Если указан новый пароль, обновляем его
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.changeUserPassword(userId, hashedPassword);
    }
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error(`Ошибка обновления пользователя ID=${params.id}:`, error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Удаление пользователя (только для админов)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Некорректный ID пользователя' },
        { status: 400 }
      );
    }
    
    // Нельзя удалить самого себя
    if (userId === user.userId) {
      return NextResponse.json(
        { error: 'Невозможно удалить текущего пользователя' },
        { status: 400 }
      );
    }
    
    // Проверяем существование пользователя
    const existingUser = await db.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }
    
    // Удаляем (деактивируем) пользователя
    await db.deleteUser(userId);
    
    return NextResponse.json(
      { message: 'Пользователь успешно удален' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Ошибка удаления пользователя ID=${params.id}:`, error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 