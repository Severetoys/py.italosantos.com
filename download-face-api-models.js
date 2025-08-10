// Script para baixar todos os modelos necessários do face-api.js/@vladmandic/face-api
// Basta rodar: node download-face-api-models.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const MODEL_DIR = path.join(__dirname, 'public', 'models');

const files = [
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_landmark_68_tiny_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
];

const BASE_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/main/model/';

if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

(async () => {
  for (const file of files) {
    const url = BASE_URL + file;
    const dest = path.join(MODEL_DIR, file);
    if (fs.existsSync(dest)) {
      console.log(`✔️  ${file} já existe, pulando.`);
      continue;
    }
    console.log(`⬇️  Baixando ${file}...`);
    try {
      await download(url, dest);
      console.log(`✅  ${file} baixado com sucesso.`);
    } catch (err) {
      console.error(`❌  Erro ao baixar ${file}:`, err.message);
    }
  }
  console.log('Todos os modelos baixados!');
})();
