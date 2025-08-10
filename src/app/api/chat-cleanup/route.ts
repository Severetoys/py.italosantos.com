// src/app/api/chat-cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { manualDeleteAllSecretChats } from '@/lib/chat-cleanup';

export async function POST(request: NextRequest) {
  try {
    // Verificar se há um token de autorização (opcional, para segurança)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CHAT_CLEANUP_TOKEN || 'cleanup-secret-2025-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log(`[API] ⚠️  INICIANDO LIMPEZA MANUAL COMPLETA - TODOS OS CHATS SECRETOS SERÃO REMOVIDOS!`);

    // Executar limpeza manual completa
    const result = await manualDeleteAllSecretChats();

    return NextResponse.json({
      success: true,
      message: 'Limpeza manual completa executada com sucesso',
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[API] Erro na limpeza manual:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Endpoint simples para verificar status
  return NextResponse.json({
    status: 'Chat cleanup API ativa - LIMPEZA MANUAL COMPLETA',
    timestamp: new Date().toISOString(),
    instructions: 'Use POST com Bearer token para executar limpeza manual completa (remove TODOS os chats secretos)',
    warning: '⚠️  Esta API agora remove TODOS os chats secretos permanentemente!'
  });
}
