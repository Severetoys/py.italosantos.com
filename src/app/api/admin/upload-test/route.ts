import { NextResponse, type NextRequest } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    success: true,
    message: 'API de upload está funcionando',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload Test] Recebendo requisição POST...');
    
    const formData = await request.formData();
    console.log('[Upload Test] FormData recebido');
    
    const file = formData.get('file') as File | null;
    console.log('[Upload Test] Arquivo:', file?.name, file?.type, file?.size);
    
    if (!file) {
      console.log('[Upload Test] Nenhum arquivo encontrado');
      return NextResponse.json({ 
        success: false,
        message: 'Nenhum arquivo enviado'
      }, { status: 400 });
    }
    
    // Para teste, apenas retornar informações do arquivo
    return NextResponse.json({
      success: true,
      message: 'Arquivo recebido com sucesso (modo teste)',
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    });
    
  } catch (error) {
    console.error('[Upload Test] Erro:', error);
    return NextResponse.json({ 
      success: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}
