'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthProvider';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Mail, Lock, Crown, Smile } from 'lucide-react';

export default function PerfilPage() {
  const router = useRouter();
  const { user, userProfile, loading, updateUserEmail, updateUserPassword, updateUserProfile, refreshUserProfile } = useAuth();
  
  // Estados
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingFaceId, setLoadingFaceId] = useState(false);
  const [showFaceIdModal, setShowFaceIdModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Verificação de autenticação
  useEffect(() => {
    if (!loading && !isRedirecting) {
      if (!user) {
        setIsRedirecting(true);
        router.push('/login');
      }
    }
  }, [user, loading, router, isRedirecting]);

  // Câmera para Face ID
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (showFaceIdModal && videoRef.current) {
      setCameraError(null);
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current && videoRef.current.play();
            };
          }
        })
        .catch((err) => {
          setCameraError('Não foi possível acessar a câmera: ' + err.message);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showFaceIdModal]);

  if (loading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !user) return;
    setUploadingPhoto(true);
    try {
      const file = fileInputRef.current.files[0];
      const storage = getStorage();
      const photoRef = storageRef(storage, `profile-photos/${user.uid}`);
      await uploadBytes(photoRef, file);
      const url = await getDownloadURL(photoRef);
      await updateProfile(user, { photoURL: url });
      await user.reload();
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      await refreshUserProfile();
      toast.success('Foto de perfil atualizada!');
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error('Erro ao atualizar foto de perfil');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleResetFaceId = async () => {
    setLoadingFaceId(true);
    try {
      localStorage.removeItem('faceIdUser');
      setShowFaceIdModal(true);
      setTimeout(() => setLoadingFaceId(false), 400);
    } catch (err) {
      toast.error('Erro ao trocar Face ID');
      setLoadingFaceId(false);
    }
  };

  const handleCaptureFace = async () => {
    if (!videoRef.current || !user) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedFace(dataUrl);
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          faceData: dataUrl,
          faceIdEnabled: true,
          lastFaceIdUpdate: new Date().toISOString()
        });
        
        localStorage.setItem('faceIdUser', JSON.stringify({
          email: user.email,
          password: '[REQUER_REAUTENTICACAO]',
          firebaseUid: user.uid,
          faceIdEnabled: true
        }));
        
        toast.success('Face ID atualizado!');
        setTimeout(() => setShowFaceIdModal(false), 1000);
      } catch (error) {
        toast.error('Erro ao salvar Face ID');
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      await updateUserProfile({ displayName: displayName });
      toast.success('Perfil atualizado!');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !currentPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    setLoadingEmail(true);
    try {
      await updateUserEmail(newEmail, currentPassword);
      toast.success('Email atualizado!');
      setNewEmail('');
      setCurrentPassword('');
    } catch (error: any) {
      let errorMessage = 'Erro ao atualizar email';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email já em uso';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      }
      toast.error(errorMessage);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoadingPassword(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      toast.success('Senha atualizada!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      let errorMessage = 'Erro ao atualizar senha';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha atual incorreta';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca';
      }
      toast.error(errorMessage);
    } finally {
      setLoadingPassword(false);
    }
  };

  if (loading || !user || !userProfile) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userProfile.photoURL} alt={userProfile.displayName} />
                <AvatarFallback className="text-lg">
                  {userProfile.displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold">{userProfile.displayName || 'Usuário'}</h1>
                  {userProfile.isSubscriber && (
                    <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-yellow-600">
                      <Crown className="w-3 h-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{userProfile.email}</p>
                <div className="text-sm text-muted-foreground">
                  Membro desde: {new Date(userProfile.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Senha</span>
            </TabsTrigger>
            <TabsTrigger value="faceid" className="flex items-center space-x-2">
              <Smile className="w-4 h-4" />
              <span>Face ID</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>Atualize suas informações pessoais</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nome de Exibição</Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Seu nome de exibição"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Foto de Perfil</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={photoPreview || userProfile.photoURL} alt={userProfile.displayName} />
                        <AvatarFallback className="text-lg">
                          {userProfile.displayName?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handlePhotoChange}
                          className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                        />
                        {photoPreview && (
                          <Button type="button" size="sm" disabled={uploadingPhoto} onClick={handlePhotoUpload}>
                            {uploadingPhoto ? 'Salvando...' : 'Salvar Foto'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={loadingProfile} className="w-full">
                    {loadingProfile ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Email</CardTitle>
                <CardDescription>Altere seu endereço de email</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Atual</Label>
                    <Input type="email" value={userProfile.email} disabled className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newEmail">Novo Email</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="novo@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPasswordEmail">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="currentPasswordEmail"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Digite sua senha atual"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loadingEmail} className="w-full">
                    {loadingEmail ? 'Atualizando...' : 'Atualizar Email'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Altere sua senha</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPasswordChange">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="currentPasswordChange"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Digite sua senha atual"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite a nova senha (mín. 6 caracteres)"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-red-500">As senhas não coincidem</p>
                  )}

                  <Button 
                    type="submit" 
                    disabled={loadingPassword || (newPassword !== confirmPassword)}
                    className="w-full"
                  >
                    {loadingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faceid">
            <Card>
              <CardHeader>
                <CardTitle>Face ID</CardTitle>
                <CardDescription>Troque o Face ID cadastrado neste dispositivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    O Face ID é salvo apenas neste navegador/dispositivo. Ao trocar, você poderá cadastrar um novo Face ID imediatamente.
                  </p>
                  <Button
                    variant="default"
                    onClick={handleResetFaceId}
                    disabled={loadingFaceId}
                    className="w-full"
                  >
                    {loadingFaceId ? 'Trocando...' : 'Trocar Face ID'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showFaceIdModal} onOpenChange={setShowFaceIdModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Capturar novo Face ID</DialogTitle>
              <DialogDescription>
                Posicione seu rosto na câmera e clique em "Capturar" para registrar seu novo Face ID.
              </DialogDescription>
            </DialogHeader>
            {cameraError ? (
              <div className="text-red-500 text-center">{cameraError}</div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <video ref={videoRef} autoPlay playsInline className="rounded-lg border w-full max-w-xs aspect-video bg-black" />
                <Button onClick={handleCaptureFace} className="w-full">Capturar</Button>
                {capturedFace && (
                  <img src={capturedFace} alt="Face capturada" className="rounded-lg border w-full max-w-xs mt-2" />
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
