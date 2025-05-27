/**
 * API-маршрут для авторизации пользователей
 * Обрабатывает запросы на вход в систему
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getUserByUsername, updateUserLastLogin } from '@/lib/db';
import { SignJWT } from 'jose';
import { hash } from "bcryptjs";

// Функция для генерации JWT токена
async function generateToken(userId: number, username: string, role: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars-long');

  const token = await new SignJWT({ userId, username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Срок жизни токена - 1 день
    .sign(secret);

  return token;
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Проверяем наличие обязательных полей
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Имя пользователя и пароль обязательны' },
        { status: 400 }
      );
    }

    // Получаем пользователя из базы данных
    const user = await getUserByUsername(username);

    // Если пользователь не найден
    if (!user) {
      console.log(`Пользователь не найден: ${username}`);
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 }
      );
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`Неверный пароль для пользователя: ${username}`);
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 }
      );
    }

    // Обновляем время последнего входа
    await updateUserLastLogin(user.id);

    // Генерируем JWT токен
    const token = await generateToken(user.id, user.username, user.role);

    // Создаем ответ
    const response = NextResponse.json({
      user: { id: user.id, username: user.username, role: user.role },
      message: 'Успешная авторизация'
    });

    // Устанавливаем куки с токеном с улучшенными параметрами
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: false, // В продакшене должно быть true
      sameSite: 'lax', // Стандартный вариант для большинства случаев
      maxAge: 60 * 60 * 24 * 10, // 10 дней в секундах
    });

    return response;
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
