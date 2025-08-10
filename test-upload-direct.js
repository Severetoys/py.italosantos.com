// test-upload-direct.js
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    console.log('Iniciando teste de upload...');
    
    // Verificar se o servidor está rodando
    const healthCheck = await fetch('http://localhost:3000');
    console.log('Servidor respondendo:', healthCheck.status);
    
    // Criar um arquivo de teste pequeno
    fs.writeFileSync('test-image.txt', 'Teste de upload - conteúdo do arquivo');
    
    const form = new FormData();
    form.append('file', fs.createReadStream('test-image.txt'), {
      filename: 'test-image.txt',
      contentType: 'text/plain'
    });
    form.append('folder', 'test-folder');
    
    console.log('Enviando requisição para /api/admin/upload...');
    
    const response = await fetch('http://localhost:3000/api/admin/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const responseText = await response.text();
    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', response.headers);
    console.log('Conteúdo da resposta:', responseText);
    
    // Tentar fazer parse do JSON
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('Resposta JSON:', jsonResponse);
    } catch (e) {
      console.log('Resposta não é JSON válido');
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testUpload();
