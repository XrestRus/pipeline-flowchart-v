/**
 * API-эндпоинты для работы с компаниями
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
 * Получение списка компаний
 * GET /api/companies
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nodeId = searchParams.get('nodeId');
    const status = searchParams.get('status');
    
    const companies = await db.getCompanies(
      nodeId || undefined, 
      status || undefined
    );
    
    return NextResponse.json({ success: true, data: companies });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

/**
 * Добавление новой компании
 * POST /api/companies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nodeId, status, comment, docLink, tenderLink, tkpLink, deadlineDate } = body;
    
    // Получаем ID пользователя из токена
    const userId = await getUserFromToken(request);
    
    // Валидация
    if (!name || !nodeId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const newCompany = await db.addCompany(
      name,
      nodeId,
      status,
      comment || '',
      userId,
      docLink || null,
      tenderLink || null,
      tkpLink || null,
      deadlineDate || null
    );
    
    return NextResponse.json(
      { success: true, data: newCompany },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create company' },
      { status: 500 }
    );
  }
} 