/**
 * API-эндпоинт для восстановления мягко удаленной компании
 */
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { jwtVerify } from 'jose';

// Функция для получения данных пользователя из токена
async function getUserFromToken(request: NextRequest): Promise<number | null> {
  try {
    // Получаем токен из cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    // Проверяем JWT токен
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars-long');
    const { payload } = await jwtVerify(token, secret);

    return payload.userId as number;
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    return null;
  }
}

/**
 * Восстановление мягко удаленной компании
 * POST /api/companies/[id]/restore
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Получаем и ожидаем id из параметров
    const id = (await params).id;

    // Убедимся что id существует перед использованием
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing ID parameter' },
        { status: 400 }
      );
    }

    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid company ID' },
        { status: 400 }
      );
    }

    // Получаем ID пользователя из токена
    const userId = await getUserFromToken(request);

    const result = await db.restoreCompany(companyId, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Company not found or already active' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('Error restoring company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore company' },
      { status: 500 }
    );
  }
}
