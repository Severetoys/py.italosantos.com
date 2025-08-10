import { NextResponse, type NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string; id: string } }
): Promise<NextResponse> {
  try {
    const { collection, id } = params;
    
    console.log(`📥 [FILE API] Buscando arquivo: ${collection}/${id}`);
    
    if (!adminDb) {
      console.error('❌ [FILE API] Firestore não inicializado');
      return new NextResponse('Servidor não disponível', { status: 503 });
    }

    // Buscar documento no Firestore
    const doc = await adminDb.collection(collection).doc(id).get();
    
    if (!doc.exists) {
      console.error('❌ [FILE API] Arquivo não encontrado');
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }

    const data = doc.data();
    
    if (!data?.fileData || !data?.type) {
      console.error('❌ [FILE API] Dados do arquivo inválidos');
      return new NextResponse('Dados do arquivo inválidos', { status: 400 });
    }

    console.log('✅ [FILE API] Arquivo encontrado, tipo:', data.type);
    
    // Converter Array de volta para Buffer
    const fileBuffer = Buffer.from(data.fileData);
    
    console.log('📤 [FILE API] Servindo arquivo, tamanho:', fileBuffer.length);
    
    // Retornar arquivo com headers corretos
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': data.type,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache de 1 ano
        'Content-Disposition': `inline; filename="${data.originalName || data.fileName}"`,
      },
    });
    
  } catch (error) {
    console.error('💥 [FILE API] Erro:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
