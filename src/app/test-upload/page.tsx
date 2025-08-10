'use client';

import { useState } from 'react';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState('admin-uploads');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setResult({ success: false, message: 'Selecione um arquivo!' });
      return;
    }

    if (!title.trim()) {
      setResult({ success: false, message: 'Título é obrigatório!' });
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('visibility', visibility);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Erro:', error);
      setResult({ 
        success: false, 
        message: `Erro na requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px' }}>
      <h1>Teste Upload - Admin API</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="file" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Arquivo *:
          </label>
          <input
            type="file"
            id="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Título *:
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título do arquivo"
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Descrição:
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição opcional (apenas para vídeos)"
            rows={3}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="folder" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Pasta:
          </label>
          <input
            type="text"
            id="folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="admin-uploads"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="visibility" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Visibilidade:
          </label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="public">Público</option>
            <option value="subscribers">Apenas Assinantes</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={uploading}
          style={{
            padding: '12px 24px',
            backgroundColor: uploading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          {uploading ? 'Fazendo upload...' : 'Upload'}
        </button>
      </form>

      {result && (
        <div style={{ 
          padding: '20px', 
          border: `2px solid ${result.success ? 'green' : 'red'}`,
          borderRadius: '8px',
          backgroundColor: result.success ? '#f0f8f0' : '#f8f0f0'
        }}>
          {result.success ? (
            <>
              <h3 style={{ color: 'green', margin: '0 0 15px 0' }}>
                ✅ Upload realizado com sucesso!
              </h3>
              <div style={{ marginBottom: '10px' }}>
                <strong>URL:</strong> <br />
                <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  {result.url}
                </a>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Nome do arquivo:</strong> {result.fileName}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Nome original:</strong> {result.originalName}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Tamanho:</strong> {result.size} bytes
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Tipo:</strong> {result.type}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Caminho no Storage:</strong> {result.path}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Visibilidade:</strong> {result.visibility}
              </div>
              {result.firestoreId && (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>ID no Firestore:</strong> {result.firestoreId}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Coleção:</strong> {result.collection}
                  </div>
                </>
              )}
              
              {result.type.startsWith('image/') && (
                <div style={{ marginTop: '15px' }}>
                  <strong>Preview:</strong><br />
                  <img 
                    src={result.url} 
                    alt="Upload preview" 
                    style={{ maxWidth: '100%', maxHeight: '300px', marginTop: '10px', border: '1px solid #ddd' }}
                  />
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'red', margin: 0 }}>
              ❌ Erro: {result.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
