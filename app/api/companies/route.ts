/**
 * API-эндпоинты для работы с компаниями
 */
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

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
    const { name, nodeId, status, comment } = body;
    
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
      comment || ''
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