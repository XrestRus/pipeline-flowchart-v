/**
 * API-эндпоинты для работы с конкретной компанией
 */
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

/**
 * Получение информации о компании по ID
 * GET /api/companies/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Убедимся что params существует перед использованием
    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Missing ID parameter' },
        { status: 400 }
      );
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid company ID' },
        { status: 400 }
      );
    }
    
    const companies = await db.getCompanies();
    const company = companies.find((c: any) => c.id === id);
    
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    console.error(`Error fetching company ${params?.id}:`, error);
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
  { params }: { params: { id: string } }
) {
  try {
    // Убедимся что params существует перед использованием
    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Missing ID parameter' },
        { status: 400 }
      );
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid company ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, nodeId, status, comment, fromNode, fromStatus } = body;
    
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
    
    const updatedCompany = await db.updateCompany(
      id,
      name,
      nodeId,
      status,
      safeComment,
      safeFromNode,
      safeFromStatus
    );
    
    return NextResponse.json({ success: true, data: updatedCompany });
  } catch (error: any) {
    console.error(`Error updating company ${params?.id}:`, error);
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
  { params }: { params: { id: string } }
) {
  try {
    // Убедимся что params существует перед использованием
    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Missing ID parameter' },
        { status: 400 }
      );
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid company ID' },
        { status: 400 }
      );
    }
    
    const result = await db.deleteCompany(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting company ${params?.id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete company' },
      { status: 500 }
    );
  }
} 