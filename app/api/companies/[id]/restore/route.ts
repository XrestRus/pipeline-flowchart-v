/**
 * API-эндпоинт для восстановления мягко удаленной компании
 */
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

/**
 * Восстановление мягко удаленной компании
 * POST /api/companies/[id]/restore
 */
export async function POST(
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
    
    const result = await db.restoreCompany(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Company not found or already active' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error(`Error restoring company ${params?.id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore company' },
      { status: 500 }
    );
  }
} 