/**
 * API-эндпоинты для работы с конкретной компанией
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
 * Получение информации о компании по ID
 * GET /api/companies/[id]
 */
export async function GET(
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

    const companies = await db.getCompanies();
    const company = companies.find((c: any) => c.id === companyId);

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

/**
 * Обновление информации о компании
 * PUT /api/companies/[id]
 */
export async function PUT(
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

    const body = await request.json();
    const { name, nodeId, status, comment, fromNode, fromStatus, docLink, tenderLink, tkpLink, deadlineDate } = body;

    // Получаем ID пользователя из токена
    const userId = await getUserFromToken(request);

    // Валидация
    if (!name || !nodeId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Преобразуем undefined в null для безопасной передачи в базу данных
    const safeFromNode = fromNode || null;
    const safeFromStatus = fromStatus || null;
    const safeComment = comment || '';
    const safeDocLink = docLink || null;
    const safeTenderLink = tenderLink || null;
    const safeTkpLink = tkpLink || null;
    const safeDeadlineDate = deadlineDate || null;

    const updatedCompany = await db.updateCompany(
      companyId,
      name,
      nodeId,
      status,
      safeComment,
      safeFromNode,
      safeFromStatus,
      userId,
      safeDocLink,
      safeTenderLink,
      safeTkpLink,
      safeDeadlineDate
    );

    return NextResponse.json({ success: true, data: updatedCompany });
  } catch (error: any) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

/**
 * Удаление компании
 * DELETE /api/companies/[id]
 */
export async function DELETE(
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

    const result = await db.deleteCompany(companyId, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}
