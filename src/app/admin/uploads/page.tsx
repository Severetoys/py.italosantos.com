"use client";

import { useState, useEffect, useRef } from 'react';
import { UploadCloud, ClipboardCopy, Link as LinkIcon, Trash2, Loader2, Eye, Download, Send, Inbox, FileImage, ArrowRight, ImageIcon, VideoIcon, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getStorage, ref, listAll, deleteObject, getMetadata, getDownloadURL, uploadBytes, updateMetadata } from "firebase/storage";
import { app as firebaseApp, db } from '@/lib/firebase';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import axios from 'axios';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Textarea } from "@/components/ui/textarea";

interface UploadedFile {
    name: string;
    url: string;
    fullPath: string;
    size: number;
    createdAt: string;
    type: string;
    visibility?: 'public' | 'subscribers' | undefined;
    isSubscriberOnly?: boolean;
    metadata?: {
        visibility?: 'public' | 'subscribers';
        customMetadata?: Record<string, string>;
    };
}

interface FileAction {
    file: UploadedFile;
    targetCollection: 'photos' | 'videos';
    visibility: 'public' | 'subscribers';
    title: string;
    description?: string;
    price?: number;
}

export default function AdminUploadsPage() {
    const { toast } = useToast();
    const storage = getStorage(firebaseApp);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(true);
    
    // Estados para gerenciamento de arquivos
    const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
    const [targetCollection, setTargetCollection] = useState<'photos' | 'videos'>('photos');
    const [actionTitle, setActionTitle] = useState('');
    const [actionDescription, setActionDescription] = useState('');
    const [actionPrice, setActionPrice] = useState(0);
    const [actionVisibility, setActionVisibility] = useState<'public' | 'subscribers'>('public');
    const [isSendingToCollection, setIsSendingToCollection] = useState(false);

    const fetchUploadedFiles = async () => {
        setIsLoadingFiles(true);
        try {
            const storageRef = ref(storage, 'italosantos.com/general-uploads/');
            const result = await listAll(storageRef);
            const filesData = await Promise.all(
                result.items.map(async (itemRef) => {
                    const url = await getDownloadURL(itemRef);
                    const metadata = await getMetadata(itemRef);
                    return {
                        name: itemRef.name,
                        url,
                        fullPath: itemRef.fullPath,
                        size: metadata.size,
                        createdAt: metadata.timeCreated,
                        type: metadata.contentType || 'unknown',
                        visibility: metadata.customMetadata?.visibility as 'public' | 'subscribers' || 'public',
                        isSubscriberOnly: metadata.customMetadata?.isSubscriberOnly === 'true',
                        metadata: {
                            visibility: metadata.customMetadata?.visibility as 'public' | 'subscribers' || 'public',
                            customMetadata: metadata.customMetadata
                        }
                    };
                })
            );
            filesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setUploadedFiles(filesData);
        } catch (error) {
            console.error("Erro ao buscar arquivos:", error);
            toast({ variant: "destructive", title: "Falha ao carregar arquivos" });
        } finally {
            setIsLoadingFiles(false);
        }
    };

    useEffect(() => {
        fetchUploadedFiles();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Upload via API (servidor)
    const handleUploadViaAPI = async () => {
        if (!file) {
            toast({ variant: "destructive", title: "Nenhum arquivo selecionado" });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        // Deixa como público por padrão, será gerenciado depois
        formData.append('visibility', 'public');
        formData.append('isSubscriberOnly', 'false');

        try {
            const response = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                },
            });

            toast({
                title: "Upload via API Concluído!",
                description: "Seu arquivo foi enviado através do servidor.",
            });
            await fetchUploadedFiles();

        } catch (error: any) {
            console.error("Erro no upload via API:", error);
            let errorMessage = "Não foi possível enviar o arquivo.";
            let suggestion = "";
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
                suggestion = error.response.data.suggestion || "";
            } else if (error.response?.data) {
                errorMessage = error.response.data;
            }
            
            toast({ 
                variant: "destructive", 
                title: "Erro no Upload via API", 
                description: suggestion ? `${errorMessage}\n\n💡 ${suggestion}` : errorMessage
            });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setFile(null);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Upload direto para Firebase Storage (client-side)
    const handleDirectFirebaseUpload = async () => {
        if (!file) {
            toast({ variant: "destructive", title: "Nenhum arquivo selecionado" });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const fileName = `italosantos.com/general-uploads/${Date.now()}_${sanitizedFileName}`;
            const storageRef = ref(storage, fileName);
            
            // Simular progresso para upload direto
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 100);

            await uploadBytes(storageRef, file);
            
            // Adicionar metadados básicos sem visibilidade (será definida depois)
            const metadata = {
                customMetadata: {
                    uploadedBy: 'admin',
                    uploadDate: new Date().toISOString()
                }
            };
            await updateMetadata(storageRef, metadata);
            
            setUploadProgress(100);
            clearInterval(progressInterval);

            toast({
                title: "Upload Direto Concluído!",
                description: "Arquivo enviado diretamente para o Firebase Storage.",
            });
            
            await fetchUploadedFiles();

        } catch (error: any) {
            console.error("Erro no upload direto:", error);
            toast({ 
                variant: "destructive", 
                title: "Erro no Upload Direto", 
                description: "Não foi possível enviar o arquivo diretamente." 
            });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setFile(null);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };
    
    const handleImportFromLink = async () => {
        if(!linkUrl || !URL.canParse(linkUrl)) {
            toast({ variant: "destructive", title: "URL Inválida", description: "Por favor, insira um link válido." });
            return;
        }
        
        setIsImporting(true);
        toast({ title: "Importando mídia...", description: "Isso pode levar alguns segundos."});
        try {
            const response = await fetch('/api/import-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: linkUrl }),
            });
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Falha ao importar o arquivo.');
            }
            
            toast({ title: "Importação Concluída!", description: `Arquivo salvo como ${result.fileName}`});
            setLinkUrl('');
            await fetchUploadedFiles();

        } catch (error: any) {
             toast({ variant: "destructive", title: "Erro na Importação", description: error.message });
        } finally {
            setIsImporting(false);
        }
    }

    const handleDelete = async (filePath: string) => {
        if (!confirm("Tem certeza que deseja excluir este arquivo? A ação é irreversível.")) return;
        try {
            const fileRef = ref(storage, filePath);
            await deleteObject(fileRef);
            toast({ title: "Arquivo Excluído!" });
            await fetchUploadedFiles();
        } catch (error) {
             console.error("Erro ao excluir: ", error);
             toast({ variant: "destructive", title: "Erro ao Excluir" });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Link copiado!" });
    };

    const isImageFile = (type: string) => {
        return type.startsWith('image/');
    };

    const formatFileSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(2);
    };

    const getFileTypeColor = (type: string) => {
        if (type.startsWith('image/')) return 'bg-green-100 text-green-800';
        if (type.startsWith('video/')) return 'bg-blue-100 text-blue-800';
        if (type.startsWith('audio/')) return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };

    // Função para abrir o diálogo de gerenciamento
    const handleManageFile = (file: UploadedFile) => {
        setSelectedFile(file);
        setActionTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extensão
        setActionDescription('');
        setActionPrice(0);
        setActionVisibility('public'); // Sempre começa como público
        setTargetCollection(file.type.startsWith('video/') ? 'videos' : 'photos');
        setIsManageDialogOpen(true);
    };

    // Função para enviar arquivo para a coleção específica
    const handleSendToCollection = async () => {
        if (!selectedFile) return;

        setIsSendingToCollection(true);
        try {
            if (targetCollection === 'photos') {
                // Adicionar à coleção de fotos
                await addDoc(collection(db, "photos"), {
                    title: actionTitle,
                    imageUrl: selectedFile.url,
                    storagePath: selectedFile.fullPath,
                    visibility: actionVisibility,
                    isSubscriberOnly: actionVisibility === 'subscribers',
                    createdAt: Timestamp.now(),
                    uploadedFrom: 'admin-uploads'
                });
                toast({
                    title: "Foto Adicionada!",
                    description: `A foto "${actionTitle}" foi adicionada à galeria de fotos com visibilidade ${actionVisibility === 'public' ? 'pública' : 'para assinantes'}.`,
                });
            } else {
                // Adicionar à coleção de vídeos
                await addDoc(collection(db, "videos"), {
                    title: actionTitle,
                    description: actionDescription,
                    price: actionPrice,
                    videoUrl: selectedFile.url,
                    thumbnailUrl: selectedFile.type.startsWith('video/') ? 'https://placehold.co/600x400.png' : selectedFile.url,
                    videoStoragePath: selectedFile.fullPath,
                    visibility: actionVisibility,
                    isSubscriberOnly: actionVisibility === 'subscribers',
                    createdAt: Timestamp.now(),
                    uploadedFrom: 'admin-uploads'
                });
                toast({
                    title: "Vídeo Adicionado!",
                    description: `O vídeo "${actionTitle}" foi adicionado à galeria de vídeos com visibilidade ${actionVisibility === 'public' ? 'pública' : 'para assinantes'}.`,
                });
            }

            // Atualizar metadados do arquivo no Storage para indicar que foi processado
            const fileRef = ref(storage, selectedFile.fullPath);
            await updateMetadata(fileRef, {
                customMetadata: {
                    ...selectedFile.metadata?.customMetadata,
                    processedToCollection: targetCollection,
                    processedAt: new Date().toISOString(),
                    visibility: actionVisibility
                }
            });

            setIsManageDialogOpen(false);
            setSelectedFile(null);
            await fetchUploadedFiles(); // Refresh da lista

        } catch (error: any) {
            console.error("Erro ao enviar arquivo para coleção:", error);
            toast({
                variant: "destructive",
                title: "Erro ao processar arquivo",
                description: `Não foi possível adicionar o arquivo à coleção.\n\n${error?.message || error}`,
            });
        } finally {
            setIsSendingToCollection(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UploadCloud className="h-6 w-6" />
                        Gerenciador de Mídias - Firebase Storage
                    </CardTitle>
                    <CardDescription>
                       Envie arquivos via servidor (API) ou diretamente ao Firebase Storage. Após o upload, gerencie e organize seus arquivos nas seções apropriadas.
                       <br />
                       <span className="text-blue-600 font-medium mt-2 block">
                           📁 Fluxo: Upload → Gerenciar → Escolher destino (Fotos/Vídeos) → Definir visibilidade
                       </span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="direct" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="direct" className="flex items-center gap-2">
                                <UploadCloud className="h-4 w-4" />
                                Upload Direto
                            </TabsTrigger>
                            <TabsTrigger value="upload" className="flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Via Servidor
                            </TabsTrigger>
                            <TabsTrigger value="link" className="flex items-center gap-2">
                                <Inbox className="h-4 w-4" />
                                Importar Link
                            </TabsTrigger>
                        </TabsList>
                        
                        
                        <TabsContent value="direct">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        Upload Direto ao Firebase
                                        <Badge className="bg-green-100 text-green-800">Recomendado</Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        Envio direto do navegador para o Firebase Storage (mais rápido e confiável)
                                        <br />
                                        <span className="text-green-600 font-medium">
                                            ✅ Funciona sem configuração adicional no servidor
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="file-upload-direct">Selecione um arquivo</Label>
                                        <Input 
                                            id="file-upload-direct" 
                                            type="file" 
                                            onChange={handleFileChange} 
                                            className="mt-1" 
                                            disabled={isUploading}
                                        />
                                    </div>
                                    
                                    {file && (
                                        <div className="p-3 bg-muted rounded-lg">
                                            <p className="text-sm font-medium">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(file.size)} MB • {file.type}
                                            </p>
                                        </div>
                                    )}
                                    {isUploading && (
                                        <div className="space-y-2">
                                            <Progress value={uploadProgress} className="w-full" />
                                            <p className="text-sm text-muted-foreground text-center">
                                                {uploadProgress}% concluído
                                            </p>
                                        </div>
                                    )}
                                    <Button onClick={handleDirectFirebaseUpload} disabled={!file || isUploading} className="w-full">
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Upload Direto...
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud className="mr-2 h-4 w-4"/>
                                                Upload Direto Firebase
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="upload">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Upload via Servidor (API)</CardTitle>
                                    <CardDescription>
                                        Envio através do servidor backend com processamento de metadados
                                        <br />
                                        <span className="text-amber-600 font-medium">
                                            ⚠️ Requer configuração de Service Account. Use "Upload Direto" se houver erros.
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="file-upload-api">Selecione um arquivo</Label>
                                        <Input 
                                            ref={fileInputRef} 
                                            id="file-upload-api" 
                                            type="file" 
                                            onChange={handleFileChange} 
                                            className="mt-1" 
                                            disabled={isUploading}
                                        />
                                    </div>
                                    
                                    {file && (
                                        <div className="p-3 bg-muted rounded-lg">
                                            <p className="text-sm font-medium">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(file.size)} MB • {file.type}
                                            </p>
                                        </div>
                                    )}
                                    {isUploading && (
                                        <div className="space-y-2">
                                            <Progress value={uploadProgress} className="w-full" />
                                            <p className="text-sm text-muted-foreground text-center">
                                                {uploadProgress}% concluído
                                            </p>
                                        </div>
                                    )}
                                    <Button onClick={handleUploadViaAPI} disabled={!file || isUploading} className="w-full">
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Enviando via API...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4"/>
                                                Enviar via Servidor
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="link">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Importar de Link Externo</CardTitle>
                                    <CardDescription>
                                        Baixe e salve arquivos de URLs externas
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="link-url">URL da Mídia</Label>
                                        <Input 
                                            id="link-url" 
                                            type="url" 
                                            placeholder="https://exemplo.com/imagem.jpg" 
                                            value={linkUrl} 
                                            onChange={(e) => setLinkUrl(e.target.value)} 
                                            className="mt-1" 
                                            disabled={isImporting} 
                                        />
                                    </div>
                                    <Button onClick={handleImportFromLink} disabled={!linkUrl || isImporting} className="w-full">
                                        {isImporting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Importando...
                                            </>
                                        ) : (
                                            <>
                                                <LinkIcon className="mr-2 h-4 w-4"/>
                                                Importar via Link
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileImage className="h-5 w-5" />
                        Arquivos no Firebase Storage
                    </CardTitle>
                    <CardDescription>
                        Lista de arquivos enviados para 'italosantos.com/general-uploads/'. Use o botão "Gerenciar" para enviar arquivos para as galerias e definir visibilidade.
                        <br />
                        <span className="text-green-600 font-medium">✓ Processado</span> = Arquivo já foi enviado para uma galeria •
                        <span className="text-blue-600 font-medium ml-2">📋 Pendente</span> = Arquivo aguardando gerenciamento
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingFiles ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Preview</TableHead>
                                    <TableHead>Nome do Arquivo</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Tamanho</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Criado em</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uploadedFiles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            Nenhum arquivo encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    uploadedFiles.map((f) => (
                                        <TableRow key={f.fullPath}>
                                            <TableCell>
                                                {isImageFile(f.type) ? (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <button className="hover:opacity-80 transition-opacity">
                                                                <Image 
                                                                    src={f.url} 
                                                                    alt={f.name}
                                                                    width={50} 
                                                                    height={50} 
                                                                    className="rounded object-cover"
                                                                />
                                                            </button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-3xl">
                                                            <Image 
                                                                src={f.url} 
                                                                alt={f.name}
                                                                width={800} 
                                                                height={600} 
                                                                className="rounded object-contain w-full h-auto"
                                                            />
                                                        </DialogContent>
                                                    </Dialog>
                                                ) : (
                                                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                                        <FileImage className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="max-w-xs truncate" title={f.name}>
                                                    {f.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getFileTypeColor(f.type)}>
                                                    {f.type.split('/')[0]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatFileSize(f.size)} MB</TableCell>
                                            <TableCell>
                                                {f.metadata?.customMetadata?.processedToCollection ? (
                                                    <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                                                        ✓ Enviado para {f.metadata.customMetadata.processedToCollection === 'photos' ? 'Fotos' : 'Vídeos'}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-blue-700 bg-blue-50 border-blue-200">
                                                        📋 Aguardando processamento
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(f.createdAt), "dd/MM/yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        onClick={() => handleManageFile(f)}
                                                        title={f.metadata?.customMetadata?.processedToCollection ? 
                                                            `Já processado para ${f.metadata.customMetadata.processedToCollection}` : 
                                                            "Gerenciar Arquivo"
                                                        }
                                                        className={f.metadata?.customMetadata?.processedToCollection ? 
                                                            "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" :
                                                            "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                                                        }
                                                        disabled={!!f.metadata?.customMetadata?.processedToCollection}
                                                    >
                                                        <FolderOpen className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        onClick={() => window.open(f.url, '_blank')}
                                                        title="Visualizar"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        onClick={() => copyToClipboard(f.url)}
                                                        title="Copiar Link"
                                                    >
                                                        <ClipboardCopy className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="destructive" 
                                                        size="icon" 
                                                        onClick={() => handleDelete(f.fullPath)}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Diálogo de Gerenciamento de Arquivos */}
            <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderOpen className="h-5 w-5" />
                            Gerenciar Arquivo
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedFile && (
                        <div className="space-y-6">
                            {/* Preview do arquivo */}
                            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                                <div className="flex-shrink-0">
                                    {selectedFile.type.startsWith('image/') ? (
                                        <Image 
                                            src={selectedFile.url} 
                                            alt={selectedFile.name}
                                            width={80} 
                                            height={80} 
                                            className="rounded object-cover"
                                        />
                                    ) : selectedFile.type.startsWith('video/') ? (
                                        <div className="w-20 h-20 bg-blue-100 rounded flex items-center justify-center">
                                            <VideoIcon className="h-8 w-8 text-blue-600" />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                                            <FileImage className="h-8 w-8 text-gray-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{selectedFile.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedFile.type} • {formatFileSize(selectedFile.size)} MB
                                    </p>
                                    <Badge className={getFileTypeColor(selectedFile.type)} variant="secondary">
                                        {selectedFile.type.split('/')[0]}
                                    </Badge>
                                </div>
                            </div>

                            {/* Seleção de destino */}
                            <div className="space-y-4">
                                <div>
                                    <Label>Enviar para qual seção?</Label>
                                    <Select 
                                        value={targetCollection} 
                                        onValueChange={(value: 'photos' | 'videos') => setTargetCollection(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o destino" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="photos">
                                                <div className="flex items-center gap-2">
                                                    <ImageIcon className="h-4 w-4" />
                                                    <span>Galeria de Fotos</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="videos">
                                                <div className="flex items-center gap-2">
                                                    <VideoIcon className="h-4 w-4" />
                                                    <span>Galeria de Vídeos</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Configurações */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="action-title">Título</Label>
                                        <Input
                                            id="action-title"
                                            value={actionTitle}
                                            onChange={(e) => setActionTitle(e.target.value)}
                                            placeholder="Digite um título"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Visibilidade</Label>
                                        <Select 
                                            value={actionVisibility} 
                                            onValueChange={(value: 'public' | 'subscribers') => setActionVisibility(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a visibilidade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="public">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        <span>Público</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="subscribers">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                                        <span>Apenas Assinantes</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Campos específicos para vídeos */}
                                {targetCollection === 'videos' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="action-description">Descrição</Label>
                                            <Textarea
                                                id="action-description"
                                                value={actionDescription}
                                                onChange={(e) => setActionDescription(e.target.value)}
                                                placeholder="Digite uma descrição para o vídeo"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="action-price">Preço (R$)</Label>
                                            <Input
                                                id="action-price"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={actionPrice}
                                                onChange={(e) => setActionPrice(parseFloat(e.target.value) || 0)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Informações de visibilidade */}
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${
                                            actionVisibility === 'subscribers' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">
                                                {actionVisibility === 'subscribers' ? 'Conteúdo para Assinantes' : 'Conteúdo Público'}
                                            </p>
                                            <p className="text-xs text-blue-700">
                                                {actionVisibility === 'subscribers' 
                                                    ? 'Apenas usuários com assinatura ativa poderão visualizar este conteúdo.'
                                                    : 'Todos os visitantes poderão visualizar este conteúdo.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsManageDialogOpen(false)}
                            disabled={isSendingToCollection}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSendToCollection}
                            disabled={!actionTitle || isSendingToCollection}
                        >
                            {isSendingToCollection ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Enviar para {targetCollection === 'photos' ? 'Fotos' : 'Vídeos'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
