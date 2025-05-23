/**
 * API-эндпоинт для скачивания файла компании
 * Доступно только авторизованным пользователям
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import * as db from '@/lib/db';
import path from 'path';
import { jwtVerify } from 'jose';

// Функция для проверки авторизации пользователя
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    // Получаем токен из cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return false;
    }

    // Проверяем JWT токен
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars-long');
    await jwtVerify(token, secret);

    // Если токен прошел проверку, значит пользователь авторизован
    return true;
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    return false;
  }
}

/**
 * Скачивание файла компании
 * GET /api/companies/[id]/files/[fileId]/download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, fileId: string }> }
) {
  try {
    // Проверяем авторизацию пользователя
    const authenticated = await isAuthenticated(request);

    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

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

    // Получаем информацию о файле
    const file = await db.getCompanyFileById(fileId);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не найден' },
        { status: 404 }
      );
    }

    // Проверяем, принадлежит ли файл указанной компании
    if (file.company_id !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Файл не принадлежит этой компании' },
        { status: 403 }
      );
    }

    // Читаем содержимое файла
    const filePath = file.file_path;
    const fileBuffer = await fs.readFile(filePath);

    // Определяем Content-Type на основе типа файла
    let contentType = file.file_type;
    if (!contentType) {
      // Если тип файла не определен, используем базовый тип
      contentType = 'application/octet-stream';
    }

    // Формируем имя файла для скачивания
    const filename = file.original_filename || path.basename(filePath);

    // Создаем заголовки для скачивания
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    headers.set('Content-Length', fileBuffer.length.toString());

    // Возвращаем файл в ответе
    // Преобразуем Buffer в Uint8Array для корректной передачи
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { success: false, error: 'Не удалось скачать файл' },
      { status: 500 }
    );
  }
}
