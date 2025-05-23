/**
 * API-эндпоинт для получения истории изменений компании
 */
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

/**
 * Получение истории изменений компании
 * GET /api/companies/[id]/logs
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

    // Получаем логи компании
    const logs = await db.getCompanyLogs(companyId);

    return NextResponse.json({
      success: true,
      data: logs
    });

  } catch (error: any) {
    console.error('Error fetching logs for company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company logs' },
      { status: 500 }
    );
  }
}
