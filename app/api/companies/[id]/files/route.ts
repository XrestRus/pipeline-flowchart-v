/**
 * API-эндпоинты для работы с файлами компании
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import * as db from '@/lib/db';
import * as upload from '@/lib/upload';
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
 * Получение списка файлов компании
 * GET /api/companies/[id]/files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Получаем и ожидаем id из параметров
    const id = (await params).id;

    // Проверяем параметр id
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

    // Получаем файлы компании
    const files = await db.getCompanyFiles(companyId);

    return NextResponse.json({
      success: true,
      data: files
    });

  } catch (error: any) {
    console.error(`Error fetching files for company:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company files' },
      { status: 500 }
    );
  }
}

/**
 * Загрузка файла для компании
 * POST /api/companies/[id]/files
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Получаем и ожидаем id из параметров
    const id = (await params).id;

    // Проверяем параметр id
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

    // Обрабатываем загрузку файла
    try {
      const result = await upload.processFileUpload(request);
      const fileData = result.file;
      const description = result.fields.description?.[0] || '';

      // Сохраняем информацию о файле в базе данных
      const file = await db.addCompanyFile(
        companyId,
        fileData.filename,
        fileData.originalFilename,
        fileData.filePath,
        fileData.fileSize,
        fileData.fileType,
        description,
        userId
      );

      return NextResponse.json({
        success: true,
        data: file
      }, { status: 201 });

    } catch (uploadError: any) {
      console.error('Ошибка загрузки файла:', uploadError);

      return NextResponse.json({
        success: false,
        error: uploadError.message || 'Failed to upload file'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error uploading file for company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
