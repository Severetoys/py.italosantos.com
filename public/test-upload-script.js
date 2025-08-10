// Script para testar upload direto
const testUpload = async () => {
  console.log('Iniciando teste de upload...');
  
  // Criar um arquivo de teste (blob de 1x1 pixel PNG)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 1, 1);
  
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'test-image.png', { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'vip-content');
      
      console.log('Enviando upload...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      try {
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        });
        
        console.log('Resposta recebida:', response.status);
        
        const data = await response.json();
        console.log('Dados da resposta:', data);
        
        if (data.success) {
          console.log('✅ Upload bem-sucedido!', data.url);
        } else {
          console.error('❌ Upload falhou:', data.message);
        }
        
        resolve(data);
      } catch (error) {
        console.error('❌ Erro na requisição:', error);
        resolve({ success: false, error: error.message });
      }
    }, 'image/png');
  });
};

// Executar o teste
testUpload();
