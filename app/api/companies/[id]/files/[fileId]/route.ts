/**
 * API-эндпоинты для работы с конкретным файлом компании
 */
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import * as upload from '@/lib/upload';
import { jwtVerify } from 'jose';
import path from 'path';

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
 * Получение информации о файле компании
 * GET /api/companies/[id]/files/[fileId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, fileId: string }> }
) {
  try {
    // Получаем и ожидаем параметры
    const id = (await params).id;
    const fileIdParam = (await params).fileId;

    // Проверяем параметры
    if (!id || !fileIdParam) {
      return NextResponse.json(
        { success: false, error: 'Missing ID parameter' },
        { status: 400 }
      );
    }

    const fileId = parseInt(fileIdParam);

    if (isNaN(fileId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    // Получаем информацию о файле
    const file = await db.getCompanyFileById(fileId);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: file
    });

  } catch (error: any) {
    console.error('Error fetching file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}

/**
 * Удаление файла компании
 * DELETE /api/companies/[id]/files/[fileId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, fileId: string }> }
) {
  try {
    // Получаем и ожидаем параметры
    const id = (await params).id;
    const fileIdParam = (await params).fileId;

    // Проверяем параметры
    if (!id || !fileIdParam) {
      return NextResponse.json(
        { success: false, error: 'Missing ID parameter' },
        { status: 400 }
      );
    }

    const companyId = parseInt(id);
    const fileId = parseInt(fileIdParam);

    if (isNaN(companyId) || isNaN(fileId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // Получаем ID пользователя из токена
    const userId = await getUserFromToken(request);

    // Получаем информацию о файле перед удалением
    const file = await db.getCompanyFileById(fileId);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Проверяем, принадлежит ли файл указанной компании
    if (file.company_id !== companyId) {
      return NextResponse.json(
        { success: false, error: 'File does not belong to this company' },
        { status: 403 }
      );
    }

    // Удаляем физический файл
    const filePath = file.file_path;
    await upload.deleteFile(filePath);

    // Удаляем запись о файле из базы данных
    const result = await db.deleteCompanyFile(fileId, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
