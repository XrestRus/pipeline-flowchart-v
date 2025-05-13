/**
 * API-эндпоинт для работы с мягко удаленными компаниями
 */
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

/**
 * Получение списка мягко удаленных компаний
 * GET /api/companies/deleted
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId') || undefined;
    const status = searchParams.get('status') || undefined;
    
    const companies = await db.getDeletedCompanies(nodeId, status);
    
    return NextResponse.json({ 
      success: true, 
      data: companies,
      count: companies.length 
    });
  } catch (error: any) {
    console.error('Ошибка при получении списка удаленных компаний:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deleted companies' },
      { status: 500 }
    );
  }
} 