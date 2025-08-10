import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH - Toggle status ativo/inativo
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { isActive } = body;
    
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({
        success: false,
        message: 'isActive deve ser um boolean'
      }, { status: 400 });
    }
    
    // Verificar se adminDb está disponível
    if (!adminDb) {
      return NextResponse.json({
        error: 'Database connection not available'
      }, { status: 500 });
    }
    
    const docRef = adminDb.collection('vipContent').doc(id);
    await docRef.update({
      isActive,
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: `Conteúdo ${isActive ? 'ativado' : 'desativado'} com sucesso`
    });
    
  } catch (error) {
    console.error('Erro ao toggle status:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao atualizar status'
    }, { status: 500 });
  }
}
