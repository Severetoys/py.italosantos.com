
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Phone, Mail, MapPin, Image as ImageIcon, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { getProfileSettings, saveProfileSettings, type ProfileSettings } from './actions';

export default function AdminSettingsPage() {
    const { toast } = useToast();
    
    const [settings, setSettings] = useState<ProfileSettings>({
        name: "Italo Santos",
        phone: "5521990479104",
        email: "pix@italosantos.com",
        address: "Avenida Paulista, São Paulo, SP, Brasil",
        profilePictureUrl: "https://placehold.co/150x150.png",
        coverPhotoUrl: "https://placehold.co/1200x400.png",
        galleryPhotos: Array(7).fill({ url: "https://placehold.co/400x600.png" }),
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            setIsLoading(true);
            try {
                const loadedSettings = await getProfileSettings();
                if (loadedSettings) {
                    // Ensure galleryPhotos has 7 items, padding with placeholders if needed
                    const gallery = loadedSettings.galleryPhotos || [];
                    while (gallery.length < 7) {
                        gallery.push({ url: "https://placehold.co/400x600.png" });
                    }
                    loadedSettings.galleryPhotos = gallery.slice(0, 7);
                    setSettings(loadedSettings);
                }
            } catch (error) {
                console.error("Failed to load settings", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao carregar configurações",
                });
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [toast]);
    
    const handleInputChange = (field: keyof ProfileSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleGalleryChange = (index: number, value: string) => {
        setSettings(prev => {
            const newGallery = [...(prev.galleryPhotos || [])];
            newGallery[index] = { ...newGallery[index], url: value };
            return { ...prev, galleryPhotos: newGallery };
        });
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await saveProfileSettings(settings);
            toast({
                title: "Configurações Salvas!",
                description: "Suas informações foram atualizadas com sucesso.",
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível salvar as configurações.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2 text-muted-foreground">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Configurações do Perfil</h1>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informações de Contato</CardTitle>
                    <CardDescription>Estes dados serão exibidos publicamente no seu site.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2"><User /> Nome de Exibição</Label>
                            <Input id="name" value={settings.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2"><Mail /> Email de Contato</Label>
                            <Input id="email" type="email" value={settings.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2"><Phone /> Telefone (WhatsApp)</Label>
                            <Input id="phone" placeholder="Ex: 5521999998888" value={settings.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address" className="flex items-center gap-2"><MapPin /> Endereço (para o mapa)</Label>
                            <Input id="address" value={settings.address} onChange={(e) => handleInputChange('address', e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Imagens do Perfil</CardTitle>
                    <CardDescription>Atualize a foto de perfil e a imagem de capa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="profilePicture" className="flex items-center gap-2"><ImageIcon /> URL da Foto de Perfil</Label>
                        <Input id="profilePicture" placeholder="https://.../sua-foto.jpg" value={settings.profilePictureUrl} onChange={(e) => handleInputChange('profilePictureUrl', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="coverPhoto" className="flex items-center gap-2"><ImageIcon /> URL da Foto de Capa</Label>
                        <Input id="coverPhoto" placeholder="https://.../sua-capa.jpg" value={settings.coverPhotoUrl} onChange={(e) => handleInputChange('coverPhotoUrl', e.target.value)} />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                Galerias da Página Inicial
                            </CardTitle>
                            <CardDescription>
                                Gerencie as 7 galerias de fotos que aparecem no rodapé da página inicial. 
                                Apenas galerias com fotos configuradas serão exibidas.
                            </CardDescription>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-2"
                            asChild
                        >
                            <a href="/" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                Ver no Site
                            </a>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {settings.galleryPhotos.map((photo, index) => {
                        const galleryLabels = [
                            "ACOMPANHANTE MASCULINO", 
                            "SENSUALIDADE", 
                            "PRAZER", 
                            "BDSM", 
                            "FETISH", 
                            "FANTASIA", 
                            "IS"
                        ];
                        
                        return (
                            <div key={`gallery-${index}`} className="space-y-3 p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor={`gallery-${index}`} className="text-sm font-medium">
                                        Galeria {index + 1}: {galleryLabels[index]}
                                    </Label>
                                    {photo.url && photo.url !== 'https://placehold.co/400x600.png' && (
                                        <span className="text-xs text-green-600 font-medium">✓ Configurada</span>
                                    )}
                                </div>
                                
                                <Input 
                                    id={`gallery-${index}`} 
                                    placeholder={`URL da imagem para "${galleryLabels[index]}"`}
                                    value={photo.url} 
                                    onChange={(e) => handleGalleryChange(index, e.target.value)}
                                />
                                
                                {/* Preview da imagem */}
                                {photo.url && photo.url !== 'https://placehold.co/400x600.png' && (
                                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                                        <img 
                                            src={photo.url} 
                                            alt={`Preview Galeria ${index + 1}`}
                                            className="w-16 h-24 object-cover rounded border"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                        <div className="text-xs text-muted-foreground">
                                            <p>Preview da imagem</p>
                                            <p className="text-green-600">✓ URL válida</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Dicas:</h4>
                        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Use URLs de imagens hospedadas (Firebase Storage, CDN, etc.)</li>
                            <li>• Formato recomendado: 400x800px (9:16) para melhor visualização</li>
                            <li>• Apenas galerias com fotos válidas aparecerão no site</li>
                            <li>• As mudanças aparecem automaticamente na página inicial</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
