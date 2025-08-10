"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Crown,
  Plus,
  Image as ImageIcon,
  Video,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Link,
  Calendar,
  Users,
} from "lucide-react";

interface VipContent {
  id: string;
  title: string;
  description: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  isActive: boolean;
  createdAt: string;
  viewCount: number;
  tags: string[];
}

export default function VipContentPage() {
  const { toast } = useToast();
  const [content, setContent] = useState<VipContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<VipContent | null>(null);
  const [filter, setFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('url');

  // Formulário
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'photo' as 'photo' | 'video',
    url: '',
    thumbnailUrl: '',
    tags: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/vip-content');
      const data = await response.json();
      
      if (data.success) {
        // Mapear dados da nova estrutura (photos/videos) para a estrutura esperada
        const mappedContent = data.content?.map((item: any) => {
          // Determinar a URL da imagem
          let imageUrl = '';
          if (item.url || item.downloadURL) {
            // Usar URL do Firebase Storage
            imageUrl = item.url || item.downloadURL;
          } else if (item.data) {
            // Usar dados base64
            imageUrl = `data:${item.type || 'image/jpeg'};base64,${item.data}`;
          }

          return {
            id: item.id,
            title: item.title || item.originalName || 'Sem título',
            description: item.description || '',
            type: item.type?.startsWith('image/') ? 'photo' : 'video',
            url: imageUrl,
            thumbnailUrl: imageUrl, // Usar a mesma URL como thumbnail
            tags: Array.isArray(item.tags) ? item.tags : (item.tags ? item.tags.split(',').map((t: string) => t.trim()) : []),
            isActive: item.visibility !== 'private',
            viewCount: 0,
            createdAt: item.createdAt || item.uploadDate || new Date().toISOString()
          };
        }) || [];
        
        setContent(mappedContent);
        console.log('[VIP Content] Dados mapeados:', mappedContent);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar conteúdo exclusivo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar conteúdo exclusivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    try {
      const sampleContent = {
        title: "Conteúdo Exclusivo de Teste",
        description: "Este é um conteúdo exclusivo de teste criado pelo painel admin",
        type: "photo",
        url: "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
        tags: ["teste", "exemplo", "exclusivo"]
      };

      const response = await fetch('/api/admin/vip-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleContent),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Conteúdo de teste criado!",
        });
        loadContent();
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao criar conteúdo de teste",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao criar dados de teste:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar dados de teste",
        variant: "destructive",
      });
    }
  };

  const uploadFile = async (file: File, isThumb = false): Promise<string | null> => {
    console.log(`[VIP Upload] Iniciando upload ${isThumb ? 'thumbnail' : 'arquivo principal'}:`, {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', isThumb ? 'vip-thumbnails' : 'vip-content');

    try {
      console.log('[VIP Upload] Enviando requisição para /api/admin/upload-v3 (SEM BASE64)...');
      
      const response = await fetch('/api/admin/upload-v3', {
        method: 'POST',
        body: formData,
      });

      console.log('[VIP Upload] Resposta recebida:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VIP Upload] Erro HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[VIP Upload] Dados da resposta:', data);

      if (data.success) {
        console.log('[VIP Upload] Upload bem-sucedido:', data.url);
        return data.url;
      } else {
        console.error('[VIP Upload] Upload falhou:', data.message);
        throw new Error(data.message || 'Erro no upload');
      }
    } catch (error) {
      console.error('[VIP Upload] Erro completo:', error);
      toast({
        title: "Erro no Upload",
        description: `Erro ao fazer upload ${isThumb ? 'da thumbnail' : 'do arquivo'}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (uploadMethod === 'url' && !formData.url) {
      toast({
        title: "Erro",
        description: "URL é obrigatória quando não há upload",
        variant: "destructive",
      });
      return;
    }

    if (uploadMethod === 'upload' && !selectedFile && !editingContent) {
      toast({
        title: "Erro",
        description: "Arquivo é obrigatório para upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      let finalUrl = formData.url;
      let finalThumbnailUrl = formData.thumbnailUrl;

      // Upload do arquivo principal se necessário
      if (uploadMethod === 'upload' && selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile);
        if (!uploadedUrl) return;
        finalUrl = uploadedUrl;
      }

      // Upload da thumbnail se necessário
      if (selectedThumbnail) {
        const uploadedThumbUrl = await uploadFile(selectedThumbnail, true);
        if (uploadedThumbUrl) {
          finalThumbnailUrl = uploadedThumbUrl;
        }
      }

      const method = editingContent ? 'PUT' : 'POST';
      const url = editingContent ? `/api/admin/vip-content/${editingContent.id}` : '/api/admin/vip-content';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          url: finalUrl,
          thumbnailUrl: finalThumbnailUrl,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: editingContent ? "Conteúdo atualizado!" : "Conteúdo adicionado!",
        });
        
        setIsAddDialogOpen(false);
        setEditingContent(null);
        setSelectedFile(null);
        setSelectedThumbnail(null);
        setFormData({
          title: '',
          description: '',
          type: 'photo',
          url: '',
          thumbnailUrl: '',
          tags: '',
        });
        loadContent();
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao salvar conteúdo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar conteúdo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: VipContent) => {
    setEditingContent(item);
    setFormData({
      title: item.title,
      description: item.description,
      type: item.type,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl || '',
      tags: item.tags.join(', '),
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/vip-content/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Conteúdo removido!",
        });
        loadContent();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao remover conteúdo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover conteúdo",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/vip-content/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `Conteúdo ${!isActive ? 'ativado' : 'desativado'}!`,
        });
        loadContent();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao toggle:', error);
    }
  };

  const filteredContent = content.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const stats = {
    total: content.length,
    photos: content.filter(c => c.type === 'photo').length,
    videos: content.filter(c => c.type === 'video').length,
    active: content.filter(c => c.isActive).length,
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Conteúdo Exclusivo
          </h1>
          <p className="text-muted-foreground">
            Gerencie fotos e vídeos exclusivos para assinantes
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingContent(null);
                setSelectedFile(null);
                setSelectedThumbnail(null);
                setUploadMethod('url');
                setFormData({
                  title: '',
                  description: '',
                  type: 'photo',
                  url: '',
                  thumbnailUrl: '',
                  tags: '',
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Conteúdo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingContent ? 'Editar' : 'Adicionar'} Conteúdo Exclusivo
              </DialogTitle>
              <DialogDescription>
                {editingContent ? 'Edite as informações' : 'Adicione novo conteúdo'} do conteúdo exclusivo para assinantes.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Digite o título..."
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Digite a descrição..."
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'photo' | 'video' }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="photo">Foto</option>
                  <option value="video">Vídeo</option>
                </select>
              </div>

              {/* Método de Upload */}
              <div className="grid gap-2">
                <Label>Método de Upload</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="url-method"
                      name="uploadMethod"
                      value="url"
                      checked={uploadMethod === 'url'}
                      onChange={(e) => setUploadMethod(e.target.value as 'url' | 'upload')}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="url-method" className="text-sm font-normal cursor-pointer">
                      <Link className="w-4 h-4 inline mr-1" />
                      URL Externa
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="upload-method"
                      name="uploadMethod"
                      value="upload"
                      checked={uploadMethod === 'upload'}
                      onChange={(e) => setUploadMethod(e.target.value as 'url' | 'upload')}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="upload-method" className="text-sm font-normal cursor-pointer">
                      <Upload className="w-4 h-4 inline mr-1" />
                      Upload de Arquivo
                    </Label>
                  </div>
                </div>
              </div>

              {/* Campo URL ou Upload baseado na seleção */}
              {uploadMethod === 'url' ? (
                <div className="grid gap-2">
                  <Label htmlFor="url">URL do Conteúdo</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="file-upload">
                    Arquivo do Conteúdo {formData.type === 'photo' ? '(Imagem)' : '(Vídeo)'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept={formData.type === 'photo' ? 'image/*' : 'video/*'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setSelectedFile(file || null);
                      }}
                      className="cursor-pointer"
                    />
                    {selectedFile && (
                      <div className="text-sm text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {selectedFile.name}
                      </div>
                    )}
                  </div>
                  {selectedFile && (
                    <div className="text-xs text-muted-foreground">
                      Tamanho: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  )}
                </div>
              )}

              {/* Thumbnail - método único baseado na escolha principal */}
              <div className="grid gap-2">
                <Label>Thumbnail (opcional)</Label>
                {uploadMethod === 'url' ? (
                  <Input
                    placeholder="URL da thumbnail..."
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setSelectedThumbnail(file || null);
                      }}
                      className="cursor-pointer"
                    />
                    {selectedThumbnail && (
                      <div className="text-sm text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {selectedThumbnail.name}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="sexy, exclusivo, premium..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleSave} disabled={uploading}>
                {uploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    {uploadMethod === 'upload' ? 'Enviando...' : 'Salvando...'}
                  </>
                ) : (
                  editingContent ? 'Atualizar' : 'Adicionar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Button 
          variant="outline" 
          onClick={createSampleData}
          className="text-xs"
        >
          📋 Dados de Teste
        </Button>
      </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fotos</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.photos}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vídeos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.videos}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="photo">Fotos</TabsTrigger>
          <TabsTrigger value="video">Vídeos</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p>Carregando conteúdo...</p>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum conteúdo encontrado</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.type === 'photo' ? (
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        ) : (
                          <Video className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge variant={item.type === 'photo' ? 'default' : 'secondary'}>
                        {item.type === 'photo' ? 'Foto' : 'Vídeo'}
                      </Badge>
                      {!item.isActive && (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                    
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {item.viewCount} views
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(item.id, item.isActive)}
                        >
                          {item.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir "{item.title}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
