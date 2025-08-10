import { NextResponse, type NextRequest } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';

// Force Node.js runtime para suporte a Buffer/stream
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🚀🚀🚀 [STORAGE V3] FIREBASE STORAGE ATIVO! 🚀🚀🚀');
    
    // Verificar se o Firebase está disponível
    if (!adminDb || !adminStorage) {
      console.error('❌ [STORAGE V3] Firebase não inicializado');
      return NextResponse.json({ 
        success: false,
        message: 'Configuração do servidor não disponível'
      }, { status: 503 });
    }

    console.log('✅ [STORAGE V3] Firebase Storage + Firestore PRONTOS!');
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'general';
    const title = formData.get('title') as string || '';
    const visibility = formData.get('visibility') as string || 'public';

    console.log('📋 [STORAGE V3] Dados recebidos:', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      folder: folder,
      title: title,
      visibility: visibility
    });

    if (!file) {
      console.error('❌ [STORAGE V3] Nenhum arquivo enviado');
      return NextResponse.json({ 
        success: false,
        message: 'Nenhum arquivo enviado'
      }, { status: 400 });
    }
    
    // Validar tamanho do arquivo (máximo 100MB para Storage)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      console.error('❌ [STORAGE V3] Arquivo muito grande:', file.size);
      return NextResponse.json({ 
        success: false,
        message: 'Arquivo muito grande. Máximo 100MB'
      }, { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/', 'video/'];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    
    if (!isValidType) {
      console.error('❌ [STORAGE V3] Tipo não permitido:', file.type);
      return NextResponse.json({ 
        success: false,
        message: 'Tipo de arquivo não permitido. Apenas imagens e vídeos'
      }, { status: 400 });
    }

    console.log('✅ [STORAGE V3] Validações OK - UPLOAD PARA FIREBASE STORAGE!');
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${timestamp}_${randomId}.${fileExtension}`;
    const storagePath = `uploads/${folder}/${fileName}`;

    console.log('📁 [STORAGE V3] Caminho:', storagePath);

    // ⚡ UPLOAD DIRETO PARA FIREBASE STORAGE ⚡
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log('⚡ [STORAGE V3] Buffer criado, tamanho:', fileBuffer.length);
    
    // Upload para Firebase Storage
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(storagePath);
    
    console.log('🔄 [STORAGE V3] Enviando para Storage...');
    
    // Upload do arquivo
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedBy: 'admin',
          folder: folder
        }
      }
    });

    console.log('🔓 [STORAGE V3] Tornando arquivo público...');
    // Tornar arquivo público
    await fileRef.makePublic();
    
    // Obter URL pública
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    console.log('🌐 [STORAGE V3] URL pública:', publicUrl);

    // Determinar coleção baseada no tipo de arquivo
    const collection = file.type.startsWith('image/') ? 'photos' : 'videos';
    const documentId = `${folder}_${timestamp}_${randomId}`;

    // Dados do documento para Firestore (apenas metadados!)
    const documentData = {
      id: documentId,
      fileName: fileName,
      originalName: file.name,
      title: title || file.name,
      type: file.type,
      size: file.size,
      folder: folder,
      visibility: visibility,
      url: publicUrl,
      downloadURL: publicUrl,
      path: storagePath,
      storageType: 'firebase-storage-v3',
      uploadedBy: 'admin',
      uploadDate: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 [STORAGE V3] Salvando metadados no Firestore...');

    // Salvar metadados no Firestore
    await adminDb.collection(collection).doc(documentId).set(documentData);

    console.log('🎉 [STORAGE V3] UPLOAD COMPLETO! FIREBASE STORAGE FUNCIONAL!');
    
    return NextResponse.json({
      success: true,
      message: 'Arquivo enviado com sucesso via Firebase Storage!',
      url: publicUrl,
      data: documentData
    });
    
  } catch (error) {
    console.error('💥 [STORAGE V3] Erro:', error);
    return NextResponse.json({ 
      success: false,
      message: `Erro durante o upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}
