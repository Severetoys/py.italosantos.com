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
import { verifyUser } from '@/ai/flows/face-auth-flow';
import { registerUserWithGoogleSheet, type RegisterUserOutput } from '@/ai/flows/google-sheets-auth-flow';
import { registerWithFaceID, loginWithFaceID, type RegisterFaceIDInput, type LoginFaceIDInput } from '@/ai/flows/google-apps-script-face-auth-flow';
import { useFaceIDAuth } from '@/contexts/face-id-auth-context';
import { useAuth } from '@/contexts/AuthProvider';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/layout/header';

// Função básica de comparação de imagens Face ID
const compareFaceImages = (image1: string, image2: string): number => {
  // Implementação básica - em produção, use uma API de reconhecimento facial
  if (!image1 || !image2) {
    console.log('[Face ID] Uma das imagens está vazia');
    return 0;
  }
  
  // Verificar se são exatamente iguais
  if (image1 === image2) {
    console.log('[Face ID] Imagens idênticas');
    return 1.0;
  }
  
  // Comparação básica por tamanho e conteúdo
  const sizeDiff = Math.abs(image1.length - image2.length) / Math.max(image1.length, image2.length);
  const sizeSimilarity = 1 - sizeDiff;
  
  // Comparar amostras de caracteres em posições específicas
  let matchingChars = 0;
  const sampleSize = Math.min(100, image1.length, image2.length);
  for (let i = 0; i < sampleSize; i += 10) {
    if (image1[i] === image2[i]) matchingChars++;
  }
  const contentSimilarity = matchingChars / (sampleSize / 10);
  
  // Média ponderada
  const similarity = (sizeSimilarity * 0.3 + contentSimilarity * 0.7);
  
  console.log('[Face ID] Comparação detalhada:');
  console.log('  - Tamanho img1:', image1.length);
  console.log('  - Tamanho img2:', image2.length);
  console.log('  - Similaridade tamanho:', sizeSimilarity.toFixed(3));
  console.log('  - Similaridade conteúdo:', contentSimilarity.toFixed(3));
  console.log('  - Similaridade final:', similarity.toFixed(3));
  
  return similarity;
};

const VideoPanel = ({ videoRef, isVerifying, hasCameraPermission }: { 
    videoRef: React.RefObject<HTMLVideoElement>, 
    isVerifying: boolean, 
    hasCameraPermission: boolean 
}) => (
    <div className="relative mx-auto w-full max-w-sm h-64 bg-muted rounded-lg overflow-hidden border border-primary/50 shadow-neon-red-light">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
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
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useFaceIDAuth();
  const { signUp, signIn, user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
    setHasCameraPermission(false);
  }, []);

  const startCamera = useCallback(async () => {
      if (mediaStreamRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acesso à Câmera Negado',
          description: 'Por favor, habilite a câmera nas configurações do seu navegador.',
        });
      }
  }, [toast]);

  // Mantém a câmera ativa o tempo todo enquanto o usuário está na página
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Detecta quando o vídeo está pronto para capturar imagem
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleCanPlay = () => setIsVideoReady(true);
    video.addEventListener('canplay', handleCanPlay);
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      setIsVideoReady(false);
    };
  }, [videoRef, hasCameraPermission]);


  const captureImage = (): string | null => {
    const video = videoRef.current;
    if (!video || !video.srcObject || video.readyState < 3 || video.videoWidth === 0 || !isVideoReady) {
      toast({
          variant: 'destructive',
          title: 'Erro de Câmera',
          description: 'A câmera não está pronta. Aguarde o vídeo carregar e tente novamente.',
      });
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  };
  
  const handleFaceAuthAction = async (action: 'login' | 'register') => {

    if (!hasCameraPermission) {
        toast({ variant: 'destructive', title: 'Câmera Desativada', description: 'Por favor, conceda acesso à câmera.' });
        return;
    }
    // Para registro, exige nome, email e senha
    if (action === 'register' && (!name || !loginEmail || !registerPassword)) {
      toast({ variant: 'destructive', title: 'Formulário Incompleto', description: 'Por favor, preencha nome, email e senha.' });
      return;
    }
  // Para login por Face ID, não exige email nem senha

    setIsVerifying(true);
    toast({ title: 'Analisando rosto...', description: 'Por favor, olhe para a câmera e aguarde.' });

    await new Promise(resolve => setTimeout(resolve, 500));

    const imageBase64 = captureImage();
    if (!imageBase64) {
        setIsVerifying(false);
        return;
    }
    
    try {
        if (action === 'register') {
            // 1. Criar usuário no Firebase
            const result = await signUp(loginEmail, registerPassword, name);
            
            // 2. Salvar dados Face ID no Firestore junto com o perfil do usuário
            if (result?.user) {
              const userDocRef = doc(db, 'users', result.user.uid);
              await updateDoc(userDocRef, {
                faceData: imageBase64,
                faceIdEnabled: true,
                phoneNumber: phone,
                lastFaceIdUpdate: new Date().toISOString()
              });
              
              console.log('[Face ID] Dados faciais salvos no Firestore para UID:', result.user.uid);
              console.log('[Face ID] Face Data (primeiros 50 chars):', imageBase64.substring(0, 50));
            }
            
            // 3. Salvar referência local para login rápido
            localStorage.setItem('faceIdUser', JSON.stringify({
              email: loginEmail,
              password: registerPassword,
              firebaseUid: result?.user?.uid,
              faceIdEnabled: true
            }));
            
            // 3. Também registrar no sistema antigo (se necessário)
            const registerData: RegisterFaceIDInput = {
              nome: name,
              email: loginEmail,
              telefone: phone,
              image: imageBase64
            };
            
            try {
              await registerWithFaceID(registerData);
            } catch (err) {
              console.warn('Falha no registro no sistema antigo:', err);
              // Não bloqueia o fluxo principal
            }
            
            toast({ title: 'Cadastro bem-sucedido!', description: 'Seu rosto e dados foram registrados com Firebase.' });
            
            // 4. Usar o contexto de autenticação
            login('member', loginEmail);
            
            // 5. Redirecionar para perfil
            router.push('/perfil');
            
        } else { // 'login'
            // 1. Verificar se tem referência local de Face ID
            const savedFaceId = localStorage.getItem('faceIdUser');
            if (savedFaceId) {
              let faceData = null;
              try {
                faceData = JSON.parse(savedFaceId);
              } catch (e) {
                toast({ variant: 'destructive', title: 'Erro no Face ID', description: 'Dados biométricos inválidos no navegador.' });
                localStorage.removeItem('faceIdUser');
                return;
              }
              
              if (faceData && faceData.email && faceData.password && faceData.firebaseUid) {
                try {
                  // 2. Fazer login no Firebase primeiro
                  await signIn(faceData.email, faceData.password);
                  
                  // 3. Buscar dados faciais salvos no Firestore
                  const userDocRef = doc(db, 'users', faceData.firebaseUid);
                  const userDoc = await getDoc(userDocRef);
                  
                  console.log('[Face ID Login] Documento do usuário existe:', userDoc.exists());
                  console.log('[Face ID Login] Dados do documento:', userDoc.data());
                  
                  if (userDoc.exists() && userDoc.data().faceIdEnabled) {
                    const savedFaceData = userDoc.data().faceData;
                    console.log('[Face ID Login] Face ID salvo encontrado (primeiros 50 chars):', savedFaceData?.substring(0, 50));
                    console.log('[Face ID Login] Face ID atual (primeiros 50 chars):', imageBase64.substring(0, 50));
                    
                    // 4. Comparar imagem atual com a salva (implementação básica)
                    const similarity = compareFaceImages(imageBase64, savedFaceData);
                    console.log('[Face ID Login] Similaridade calculada:', similarity);
                    
                    if (similarity > 0.8) { // 80% de similaridade mínima
                      toast({ title: 'Login bem-sucedido!', description: 'Face ID verificado com sucesso!' });
                      router.push('/perfil');
                      return;
                    } else {
                      toast({ variant: 'destructive', title: 'Face ID não reconhecido', description: `Rosto não confere (${Math.round(similarity*100)}% similaridade).` });
                      return;
                    }
                  } else {
                    toast({ variant: 'destructive', title: 'Face ID não habilitado', description: 'Esta conta não tem Face ID configurado no banco.' });
                    return;
                  }
                } catch (error) {
                  console.error('Erro no login Firebase via Face ID:', error);
                  toast({ variant: 'destructive', title: 'Erro no Face ID', description: 'Falha na autenticação. Verifique suas credenciais.' });
                  return;
                }
              }
            }
            
            // 2. Se não tem Face ID local, mostrar erro
            toast({ 
              variant: 'destructive', 
              title: 'Face ID não configurado', 
              description: 'Nenhum Face ID encontrado neste dispositivo. Configure primeiro ou use email/senha.' 
            });
        }
    } catch (error: any) {
        console.error(`Error during ${action}:`, error);
        let errorMessage = 'Algo deu errado durante a verificação.';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Este email já está em uso.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'A senha é muito fraca.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido.';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Senha incorreta.';
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'Usuário não encontrado.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
            variant: 'destructive',
            title: 'Ocorreu um Erro',
            description: errorMessage,
        });
    } finally {
        setIsVerifying(false);
    }
  };

  const handleEmailPasswordLogin = () => {
    // Lógica de login com email e senha para o administrador ver a área do cliente.
    if (loginEmail.toLowerCase() === 'pix@italosantos.com' && loginPassword === 'Severe123@') {
      toast({ title: 'Login de administrador bem-sucedido!', description: 'Redirecionando para a área do assinante...' });
      localStorage.setItem('isAuthenticated', 'true');
      router.push('/assinante');
    } else {
      toast({ variant: 'destructive', title: 'Falha na Autenticação', description: 'Email ou senha incorretos.' });
    }
  };

  const handleLogout = () => {
    // Adicione lógica de logout se necessário
    router.push('/');
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
                Italo Santos
            </h1>
            <p className="text-muted-foreground pt-2">
                Autenticação Segura
            </p>
          </div>
          <div className="p-6 pt-2">
            <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-background/50 border border-primary/20">
                    <TabsTrigger value="signin" className="data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-red-light">Face ID</TabsTrigger>
                    <TabsTrigger value="signin-email" className="data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-red-light">Email</TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-red-light">Cadastrar</TabsTrigger>
                </TabsList>
                        {/* VideoPanel sempre renderizado, câmera sempre ativa */}
                        <div className="space-y-4 pt-4">
                          <VideoPanel videoRef={videoRef} isVerifying={isVerifying} hasCameraPermission={hasCameraPermission} />
                        </div>
                        <TabsContent value="signin">
                            <div className="space-y-4 pt-4">
                                <Button onClick={() => handleFaceAuthAction('login')} disabled={!hasCameraPermission || !isVideoReady || isVerifying} className="w-full justify-center h-12 text-base bg-primary/90 hover:bg-primary text-primary-foreground shadow-neon-red-light hover:shadow-neon-red-strong">
                                <Fingerprint className="w-5 h-5 mr-2" />
                                {isVerifying ? 'Verificando...' : 'Entrar com Face ID'}
                                </Button>
                            </div>
                        </TabsContent>
                         <TabsContent value="signin-email">
                            <div className="space-y-4 pt-4">
                                <InputField id="login-email" label="Email" icon={<Mail size={16} />} type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="seu@email.com" />
                                <InputField id="login-password" label="Senha" icon={<KeyRound size={16} />} type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="********" />
                                <Button onClick={handleEmailPasswordLogin} disabled={isVerifying || !loginEmail || !loginPassword} className="w-full justify-center h-12 text-base bg-primary/90 hover:bg-primary text-primary-foreground shadow-neon-red-light hover:shadow-neon-red-strong">
                                   <KeyRound className="w-5 h-5 mr-2" />
                                   Entrar
                                </Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="signup">
                            <div className="space-y-4 pt-4">
                                <InputField id="name" label="Nome Completo" icon={<UserPlus size={16} />} type="text" value={name} onChange={(e) => setName(e.target.value)} />
                                <InputField id="email" label="Endereço de Email" icon={<Mail size={16} />} type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                                <InputField id="phone" label="Número de Telefone" icon={<Phone size={16} />} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                <InputField id="password" label="Senha" icon={<Lock size={16} />} type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                                <Button onClick={() => handleFaceAuthAction('register')} disabled={!hasCameraPermission || !isVideoReady || isVerifying || !name || !loginEmail || !registerPassword} className="w-full justify-center h-12 text-base bg-primary/90 hover:bg-primary text-primary-foreground shadow-neon-red-light hover:shadow-neon-red-strong">
                                <Fingerprint className="w-5 h-5 mr-2" />
                                {isVerifying ? 'Verificando...' : 'Cadastrar com Face ID'}
                                </Button>
                            </div>
                        </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </main>
  );
}
