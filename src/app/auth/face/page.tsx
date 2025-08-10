"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Fingerprint, ShieldCheck, UserPlus, Mail, Phone, VideoOff, KeyRound, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthProvider';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/layout/header';
import PasswordConfirmModal from '@/components/password-confirm-modal';
import { useFaceAPI } from '@/hooks/use-face-api';

// Função de comparação será substituída pelo face-api.js

const VideoPanel = ({ videoRef, isVerifying, hasCameraPermission, faceApiStatus }: { 
    videoRef: React.RefObject<HTMLVideoElement>, 
    isVerifying: boolean, 
    hasCameraPermission: boolean,
    faceApiStatus: string
}) => (
    <div className="relative mx-auto w-full max-w-sm h-64 bg-muted rounded-lg overflow-hidden border border-primary/50 shadow-neon-red-light">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        
        {/* Status indicators */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <span className={`text-xs px-2 py-1 rounded-full ${
            faceApiStatus === '🤖 IA Ativada' ? 'bg-green-500/90 text-white' :
            faceApiStatus === '⏳ Carregando IA' ? 'bg-yellow-500/90 text-white' :
            faceApiStatus === '⚠️ Modo Básico' ? 'bg-orange-500/90 text-white' :
            'bg-red-500/90 text-white'
          }`}>
            {faceApiStatus}
          </span>
        </div>
        
        {isVerifying && <div className="absolute inset-0 border-4 border-primary animate-pulse"></div>}
        {!hasCameraPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 text-center">
                 <VideoOff className="w-12 h-12 text-destructive mb-4" />
                <Alert variant="destructive" className="bg-transparent text-destructive-foreground border-0">
                    <AlertTitle>Câmera Indisponível</AlertTitle>
                    <AlertDescription>
                        Por favor, permita o acesso à câmera no seu navegador para continuar.
                    </AlertDescription>
                </Alert>
            </div>
        )}
    </div>
);

const InputField = ({ id, label, icon, type, value, onChange, placeholder }: { 
    id: string, 
    label: string, 
    icon: React.ReactNode, 
    type: string, 
    value: string, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    placeholder?: string
}) => (
    <div className="space-y-2">
        <Label htmlFor={id} className="flex items-center gap-2 text-muted-foreground">
            {icon} {label}
        </Label>
        <Input 
            id={id} 
            type={type} 
            value={value} 
            onChange={onChange} 
            required 
            placeholder={placeholder}
            className="h-11 bg-background/50 border-primary/30 focus:shadow-neon-red-light" 
        />
    </div>
);

export default function FaceAuthPage() {
  // TODOS os hooks devem ser executados sempre, na mesma ordem
  const { toast } = useToast();
  const router = useRouter();
  const { 
    isLoaded: faceApiLoaded, 
    isLoading: faceApiLoading, 
    error: faceApiError, 
    status: faceApiStatus,
    extractFaceDescriptor,
    compareFaceDescriptors,
    base64ToDescriptor 
  } = useFaceAPI();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Dados do formulário
  const [name, setName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados para modal de confirmação de senha
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{email: string, similarity: number} | null>(null);
  const [isConfirmingLogin, setIsConfirmingLogin] = useState(false);

  // Função para comparar rostos usando face-api.js
  const compareFaceImages = async (capturedImage: string, storedImage: string): Promise<number> => {
    // Se face-api.js falhou, usar fallback básico melhorado
    if (!faceApiLoaded || faceApiError) {
      console.warn('[Face Compare] Face API indisponível, usando fallback básico melhorado');
      
      if (!capturedImage || !storedImage) return 0;
      if (capturedImage === storedImage) return 1.0;
      
      // Fallback: comparação básica mas mais rigorosa
      const minLength = Math.min(capturedImage.length, storedImage.length);
      const maxLength = Math.max(capturedImage.length, storedImage.length);
      
      // Se diferença de tamanho > 10%, provavelmente não é o mesmo rosto
      if ((maxLength - minLength) / maxLength > 0.1) return 0;
      
      // Comparar várias seções da imagem
      let totalMatches = 0;
      const sections = 10;
      const sectionSize = Math.floor(minLength / sections);
      
      for (let i = 0; i < sections; i++) {
        const start = i * sectionSize;
        const end = start + sectionSize;
        const section1 = capturedImage.substring(start, end);
        const section2 = storedImage.substring(start, end);
        
        if (section1 === section2) {
          totalMatches++;
        }
      }
      
      const similarity = totalMatches / sections;
      console.log(`[Fallback Compare] ${totalMatches}/${sections} seções iguais = ${(similarity * 100).toFixed(1)}%`);
      return similarity;
    }

    try {
      // Usar face-api.js real
      console.log('[Face Compare] Usando Face API para comparação real...');
      
      // Extrair descriptors das duas imagens
      const [descriptor1, descriptor2] = await Promise.all([
        extractFaceDescriptor(capturedImage),
        extractFaceDescriptor(storedImage)
      ]);

      if (!descriptor1 || !descriptor2) {
        console.warn('[Face Compare] Não foi possível extrair descriptors, usando fallback');
        // Usar fallback se não conseguir extrair descriptors
        return capturedImage === storedImage ? 1.0 : 0.3;
      }

      // Comparar descriptors (já retorna valor 0-100)
      const similarity = compareFaceDescriptors(descriptor1, descriptor2) / 100;
      console.log(`[Face API Compare] Similaridade real: ${(similarity * 100).toFixed(1)}%`);
      
      return similarity;
    } catch (error) {
      console.error('[Face Compare] Erro na comparação, usando fallback:', error);
      // Em caso de erro, usar fallback básico
      return capturedImage === storedImage ? 1.0 : 0.2;
    }
  };

  // Função para confirmar senha do modal
  const handlePasswordConfirm = async (password: string) => {
    if (!selectedUser) return;
    
    setIsConfirmingLogin(true);
    try {
      await signIn(selectedUser.email, password);
      toast({ title: 'Login realizado!', description: 'Face ID confirmado com sucesso.' });
      setShowPasswordModal(false);
      setSelectedUser(null);
      // Direciona para a tela de configuração de conta após login
      router.push('/perfil');
    } catch (error: any) {
      console.error('[Login] Erro na senha:', error);
      if (error.code === 'auth/invalid-credential') {
        toast({ 
          variant: 'destructive', 
          title: 'Senha incorreta', 
          description: `Senha inválida para ${selectedUser.email}. Tente novamente.`
        });
      } else {
        toast({ variant: 'destructive', title: 'Erro no login', description: error.message });
      }
    } finally {
      setIsConfirmingLogin(false);
    }
  };

  // Função para fechar modal
  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    setIsVerifying(false);
  };

  // Hooks devem ser chamados sempre, nunca condicionalmente
  const authContext = useAuth();
  const { signUp, signIn, user } = authContext;

  // Verificar se usuário já está logado e redirecionar para configuração de conta
  useEffect(() => {
    if (user) {
      toast({ 
        title: 'Já logado!', 
        description: 'Redirecionando para a configuração de conta...' 
      });
      router.push('/perfil');
    }
  }, [user, router]);

  // Configurar câmera
  const setupCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsVideoReady(true);
        };
      }
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setHasCameraPermission(false);
    }
  }, []);

  useEffect(() => {
    setupCamera();
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [setupCamera]);

  // Capturar imagem da câmera
  const captureImage = (): string | null => {
    if (!videoRef.current) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    }
    return null;
  };

  // LÓGICA PRINCIPAL - CADASTRO E LOGIN
  const handleFaceAuthAction = async (action: 'login' | 'register') => {
    if (!hasCameraPermission) {
      toast({ variant: 'destructive', title: 'Câmera necessária', description: 'Permita acesso à câmera.' });
      return;
    }
    
    if (action === 'register' && (!name || !loginEmail || !registerPassword)) {
      toast({ variant: 'destructive', title: 'Dados obrigatórios', description: 'Preencha nome, email e senha.' });
      return;
    }

    setIsVerifying(true);
    toast({ title: 'Capturando Face ID...', description: 'Mantenha o rosto na câmera.' });

    await new Promise(resolve => setTimeout(resolve, 1000));
    const faceImage = captureImage();
    
    if (!faceImage) {
      toast({ variant: 'destructive', title: 'Erro na captura', description: 'Não foi possível capturar sua imagem.' });
      setIsVerifying(false);
      return;
    }

    try {
      if (action === 'register') {
        // VERIFICAÇÃO ANTI-DUPLICATA: Verificar se o rosto já existe
        console.log('[Cadastro] Verificando se o rosto já está cadastrado...');
        const allUsersRef = collection(db, 'users');
        const allUsersQuery = query(allUsersRef, where('faceIdEnabled', '==', true));
        const allUsersSnapshot = await getDocs(allUsersQuery);
        
        let faceAlreadyExists = false;
        let existingUserEmail = '';
        
        // Usar for...of para poder usar await
        for (const doc of allUsersSnapshot.docs) {
          const userData = doc.data();
          if (userData.faceData) {
            const similarity = await compareFaceImages(faceImage, userData.faceData);
            console.log(`[Verificação] Similaridade com usuário ${userData.email}: ${(similarity * 100).toFixed(1)}%`);
            
            if (similarity >= 0.90) { // 90% de similaridade = mesmo rosto (muito rigoroso)
              faceAlreadyExists = true;
              existingUserEmail = userData.email;
              break; // Sair do loop ao encontrar match
            }
          }
        }
        
        if (faceAlreadyExists) {
          console.log('[Cadastro] Rosto já cadastrado para:', existingUserEmail);
          toast({ 
            variant: 'destructive', 
            title: 'Rosto já cadastrado', 
            description: `Este rosto já está associado a uma conta (${existingUserEmail.replace(/(.{3}).*(@.*)/, '$1***$2')}). Use o login Face ID.`
          });
          setIsVerifying(false);
          return;
        }
        
        // CADASTRO: Criar conta + Face ID (apenas se rosto for único)
        console.log('[Cadastro] Rosto único confirmado. Criando conta no Firebase com nome:', name);
        const result = await signUp(loginEmail, registerPassword, name);
        console.log('[Cadastro] Conta criada, UID:', result.user.uid);
        
        // Salvar Face ID no perfil
        const userDocRef = doc(db, 'users', result.user.uid);
        await updateDoc(userDocRef, {
          faceData: faceImage,
          faceIdEnabled: true,
          phoneNumber: phone || ''
        });
        
        console.log('[Cadastro] Face ID salvo para usuário:', result.user.uid);
        toast({ title: 'Cadastro concluído!', description: 'Conta criada com Face ID ativado.' });
        router.push('/perfil');
        
      } else {
        // LOGIN: Buscar Face ID correspondente
        console.log('[Login] Buscando Face ID no banco...');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('faceIdEnabled', '==', true));
        const snapshot = await getDocs(q);
        
        let bestMatch = null;
        let highestSimilarity = 0;
        
        // Usar for...of para poder usar await na comparação
        for (const doc of snapshot.docs) {
          const userData = doc.data();
          if (userData.faceData) {
            const similarity = await compareFaceImages(faceImage, userData.faceData);
            console.log(`[Login] Comparando com ${userData.email}: ${(similarity*100).toFixed(1)}% similaridade`);
            
            if (similarity > highestSimilarity && similarity > 0.90) {
              console.log(`[Login] ✅ MATCH ENCONTRADO: ${userData.email} (${(similarity*100).toFixed(1)}%)`);
              highestSimilarity = similarity;
              bestMatch = { uid: doc.id, ...userData };
            } else if (similarity > 0.50) {
              console.log(`[Login] ⚠️  Similaridade média detectada: ${userData.email} (${(similarity*100).toFixed(1)}%) - abaixo do threshold`);
            }
          }
        }
        
        if (bestMatch) {
          // Face ID reconhecido - abrir modal para senha
          console.log(`[Login] ✅ LOGIN AUTORIZADO: ${(bestMatch as any).email} com ${(highestSimilarity*100).toFixed(1)}% de similaridade`);
          setSelectedUser({
            email: (bestMatch as any).email,
            similarity: highestSimilarity
          });
          setShowPasswordModal(true);
          // Não setIsVerifying(false) aqui, deixa o modal controlar
        } else {
          console.log(`[Login] ❌ NENHUM MATCH: Maior similaridade encontrada foi ${(highestSimilarity*100).toFixed(1)}% (necessário 90%+)`);
          toast({ 
            variant: 'destructive', 
            title: 'Face ID não reconhecido', 
            description: `Seu rosto não foi reconhecido. Maior similaridade: ${(highestSimilarity*100).toFixed(1)}% (necessário: 90%+)`
          });
        }
      }
    } catch (error: any) {
      console.error('Erro:', error);
      let message = 'Erro inesperado.';
      if (error.code === 'auth/email-already-in-use') message = 'Email já cadastrado.';
      if (error.code === 'auth/weak-password') message = 'Senha muito fraca.';
      if (error.code === 'auth/wrong-password') message = 'Senha incorreta.';
      
      toast({ variant: 'destructive', title: 'Erro', description: message });
    } finally {
      setIsVerifying(false);
    }
  };

  // LOGIN COM EMAIL/SENHA NORMAL
  const handleEmailLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast({ variant: 'destructive', title: 'Dados obrigatórios', description: 'Digite email e senha.' });
      return;
    }
    
    try {
      await signIn(loginEmail, loginPassword);
      toast({ title: 'Login realizado!', description: 'Bem-vindo de volta!' });
      // Direciona para a tela de configuração de conta após login
      router.push('/perfil');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro no login', description: 'Email ou senha incorretos.' });
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-background">
      <Header onMenuClick={() => setMenuOpen(!menuOpen)} />
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-lg animate-in fade-in-0 zoom-in-95 duration-500 shadow-neon-red-strong border-primary/50 bg-card/90 backdrop-blur-xl">
          <div className="text-center p-6 pb-2 relative">
            <div className="flex justify-center items-center mb-4 pt-8">
                <ShieldCheck className="h-12 w-12 text-primary text-shadow-neon-red" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-shadow-neon-red-light">
                Italo Santos Pro
            </h1>
            <p className="text-muted-foreground pt-2">
                Login com Face ID ou Email/Senha
            </p>
          </div>
          
          <div className="p-6 pt-2">
            {/* Câmera sempre visível */}
            <div className="space-y-4 mb-6">
              <VideoPanel 
                videoRef={videoRef} 
                isVerifying={isVerifying} 
                hasCameraPermission={hasCameraPermission}
                faceApiStatus={faceApiStatus}
              />
            </div>

            <Tabs defaultValue="face-login" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-background/50 border border-primary/20">
                <TabsTrigger value="face-login">Face ID</TabsTrigger>
                <TabsTrigger value="email-login">Email/Senha</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>
              
              {/* Login com Face ID */}
              <TabsContent value="face-login">
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Olhe para a câmera e clique no botão abaixo
                  </p>
                  <Button 
                    onClick={() => handleFaceAuthAction('login')} 
                    disabled={!hasCameraPermission || !isVideoReady || isVerifying}
                    className="w-full h-12 bg-primary/90 hover:bg-primary"
                  >
                    <Fingerprint className="w-5 h-5 mr-2" />
                    {isVerifying ? 'Verificando...' : 'Entrar com Face ID'}
                  </Button>
                </div>
              </TabsContent>
              
              {/* Login com Email/Senha */}
              <TabsContent value="email-login">
                <div className="space-y-4 pt-4">
                  <InputField 
                    id="email-login" 
                    label="Email" 
                    icon={<Mail size={16} />} 
                    type="email" 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                  />
                  <InputField 
                    id="password-login" 
                    label="Senha" 
                    icon={<Lock size={16} />} 
                    type="password" 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                  />
                  <Button 
                    onClick={handleEmailLogin}
                    className="w-full h-12 bg-primary/90 hover:bg-primary"
                  >
                    <KeyRound className="w-5 h-5 mr-2" />
                    Entrar
                  </Button>
                </div>
              </TabsContent>
              
              {/* Cadastro */}
              <TabsContent value="register">
                <div className="space-y-4 pt-4">
                  <InputField 
                    id="name" 
                    label="Nome Completo" 
                    icon={<UserPlus size={16} />} 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                  <InputField 
                    id="email" 
                    label="Email" 
                    icon={<Mail size={16} />} 
                    type="email" 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                  />
                  <InputField 
                    id="phone" 
                    label="Telefone (opcional)" 
                    icon={<Phone size={16} />} 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                  <InputField 
                    id="password" 
                    label="Senha" 
                    icon={<Lock size={16} />} 
                    type="password" 
                    value={registerPassword} 
                    onChange={(e) => setRegisterPassword(e.target.value)} 
                  />
                  <Button 
                    onClick={() => handleFaceAuthAction('register')} 
                    disabled={!hasCameraPermission || !isVideoReady || isVerifying || !name || !loginEmail || !registerPassword}
                    className="w-full h-12 bg-primary/90 hover:bg-primary"
                  >
                    <Fingerprint className="w-5 h-5 mr-2" />
                    {isVerifying ? 'Cadastrando...' : 'Cadastrar com Face ID'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>

      {/* Modal de confirmação de senha */}
      {selectedUser && (
        <PasswordConfirmModal
          isOpen={showPasswordModal}
          onClose={handlePasswordModalClose}
          onConfirm={handlePasswordConfirm}
          userEmail={selectedUser.email}
          similarity={selectedUser.similarity}
          isLoading={isConfirmingLogin}
        />
      )}
    </main>
  );
}
