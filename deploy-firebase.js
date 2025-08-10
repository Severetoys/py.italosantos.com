const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Iniciando deploy no Firebase Hosting...');
console.log('=====================================');

try {
  // Backup do next.config.js original
  console.log('📁 Fazendo backup da configuração...');
  if (fs.existsSync('next.config.js')) {
    fs.copyFileSync('next.config.js', 'next.config.backup.js');
  }
  
  // Usar configuração para Firebase
  if (fs.existsSync('next.config.firebase.js')) {
    fs.copyFileSync('next.config.firebase.js', 'next.config.js');
  }
  
  // Definir variável para export estático
  process.env.FIREBASE_DEPLOY = 'true';
  
  // Build do projeto
  console.log('📦 Fazendo build para Firebase...');
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, FIREBASE_DEPLOY: 'true' }
  });
  
  // Verificar se pasta out foi criada
  if (!fs.existsSync('out')) {
    throw new Error('Pasta "out" não foi criada. Verifique a configuração do Next.js');
  }
  
  console.log('✅ Build concluído com sucesso!');
  
  // Deploy no Firebase
  console.log('🚀 Fazendo deploy no Firebase...');
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  
  console.log('');
  console.log('🎉 Deploy concluído com sucesso!');
  console.log('🌐 Seu site está disponível em:');
  console.log('   • https://authkit-y9vjx.web.app');
  console.log('   • https://authkit-y9vjx.firebaseapp.com');
  console.log('');
  
} catch (error) {
  console.error('❌ Erro no deploy:', error.message);
  
  // Sugestões de solução
  console.log('');
  console.log('💡 Possíveis soluções:');
  console.log('   1. Instale Firebase CLI: npm install -g firebase-tools');
  console.log('   2. Faça login: firebase login');
  console.log('   3. Inicialize: firebase init hosting');
  console.log('   4. Verifique as variáveis de ambiente');
  console.log('');
  
  process.exit(1);
} finally {
  // Restaurar configuração original
  console.log('🔄 Restaurando configuração original...');
  if (fs.existsSync('next.config.backup.js')) {
    fs.copyFileSync('next.config.backup.js', 'next.config.js');
    fs.unlinkSync('next.config.backup.js');
  }
}
