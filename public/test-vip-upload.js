// Test upload VIP Content - Execute no console do navegador
async function testVipUpload() {
    console.log('🧪 Iniciando teste de upload VIP...');
    
    // Criar um arquivo de teste pequeno
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // Desenhar algo simples
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(25, 25, 50, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('VIP', 35, 55);
    
    return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'test-vip-upload.png', { type: 'image/png' });
            
            console.log('📁 Arquivo criado:', {
                name: file.name,
                size: file.size,
                type: file.type
            });
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'vip-content');
            
            try {
                console.log('🚀 Enviando upload...');
                const response = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: formData
                });
                
                console.log('📥 Resposta recebida:', response.status, response.statusText);
                
                const data = await response.json();
                
                if (data.success) {
                    console.log('✅ UPLOAD FUNCIONANDO!');
                    console.log('🔗 URL:', data.url);
                    console.log('📊 Dados:', data);
                    
                    // Tentar abrir a imagem
                    const img = new Image();
                    img.onload = () => console.log('🖼️ Imagem carregada com sucesso!');
                    img.onerror = () => console.log('❌ Erro ao carregar imagem');
                    img.src = data.url;
                    
                } else {
                    console.log('❌ Upload falhou:', data.message);
                }
                
                resolve(data);
                
            } catch (error) {
                console.error('💥 Erro na requisição:', error);
                resolve({ success: false, error: error.message });
            }
            
        }, 'image/png', 0.9);
    });
}

// Executar automaticamente quando carregado
testVipUpload().then(result => {
    console.log('🏁 Teste finalizado:', result.success ? 'SUCESSO' : 'FALHA');
});
