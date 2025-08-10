// src/app/api/upload/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Ensure Node runtime (required for Buffer/streams)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[Upload API] Iniciando upload...');

    // Verificar se o Firebase Admin está disponível
    if (!adminDb) {
      console.error('[Upload API] Firebase Admin não inicializado');
      return NextResponse.json(
        { success: false, message: 'Configuração do servidor não disponível' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const maybeFolder = formData.get('folder');
    const folder = typeof maybeFolder === 'string' && maybeFolder.trim() ? maybeFolder.trim() : 'general';
    const maybeTitle = formData.get('title');
    const title = typeof maybeTitle === 'string' && maybeTitle.trim() ? maybeTitle.trim() : 'Sem título';
    const maybeVisibility = formData.get('visibility');
    const visibility = typeof maybeVisibility === 'string' && ['public', 'private'].includes(maybeVisibility) ? maybeVisibility : 'public';

    console.log('[Upload API] Arquivo recebido:', (file as any)?.name, (file as any)?.type, (file as any)?.size);

    if (!file) {
      console.error('[Upload API] Nenhum arquivo enviado');
      return NextResponse.json({ success: false, message: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tamanho do arquivo (máximo 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (typeof file.size === 'number' && file.size > maxSize) {
      console.error('[Upload API] Arquivo muito grande:', file.size);
      return NextResponse.json({ success: false, message: 'Arquivo muito grande. Máximo 100MB' }, { status: 400 });
    }

    // Validar tipo de arquivo (somente imagens e vídeos)
    const allowedPrefixes = ['image/', 'video/'];
    const fileType = (file as any)?.type || '';
    const isValidType = allowedPrefixes.some((p) => fileType.startsWith(p));
    if (!isValidType) {
      console.error('[Upload API] Tipo não permitido:', fileType);
      return NextResponse.json(
        { success: false, message: 'Tipo de arquivo não permitido. Apenas imagens e vídeos' },
        { status: 400 }
      );
    }

    // Preparar nome único de arquivo
    const originalName = (file as any)?.name || 'upload';
    const sanitized = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const hasDot = sanitized.includes('.');
    const extFromName = hasDot ? sanitized.split('.').pop()!.toLowerCase() : '';
    const fallbackExt = fileType.startsWith('image/') ? 'jpg' : fileType.startsWith('video/') ? 'mp4' : 'bin';
    const ext = extFromName || fallbackExt;
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const fileName = `${uniqueSuffix}_${sanitized.replace(/\./g, '_')}`;

    console.log('[Upload API] Nome do arquivo:', fileName);

    // Converter arquivo para base64
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const base64Data = fileBuffer.toString('base64');

    console.log('[Upload API] Arquivo convertido para base64, tamanho:', base64Data.length);

    // Salvar no Firestore
    const filePath = `firestore-uploads/${folder}/${fileName}`;
    const docData = {
      fileName,
      originalName,
      size: file.size ?? fileBuffer.byteLength,
      type: fileType,
      path: filePath,
      firestoreId: fileName,
      collection: 'photos',
      visibility,
      title,
      storageType: 'firestore-base64',
      data: base64Data,
      createdAt: new Date().toISOString(),
      uploadedBy: 'user',
      folder
    };

    console.log('[Upload API] Salvando documento no Firestore...');
    await adminDb.collection('photos').doc(fileName).set(docData);

    console.log('[Upload API] Upload finalizado com sucesso');

    // Retornar resposta de sucesso
    return NextResponse.json({
      success: true,
      message: 'Upload realizado com sucesso',
      fileName,
      originalName,
      size: file.size ?? fileBuffer.byteLength,
      type: fileType,
      path: filePath,
      firestoreId: fileName,
      collection: 'photos',
      visibility,
      storageType: 'firestore-base64'
    });

  } catch (error) {
    console.error('[Upload API] Erro geral:', error);
    return NextResponse.json(
      { success: false, message: `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
}
