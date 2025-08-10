
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DeleteSecretChatButton from '@/components/delete-secret-chat-button';
import { Send, Loader2, MapPin, Paperclip, Video, Mic, CheckCircle } from 'lucide-react';
import { db, auth, storage } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, doc, setDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { signInAnonymously } from 'firebase/auth';


interface Message {
  id: string;
  senderId: string;
  text: string; 
  originalText?: string;
  timestamp: Timestamp;
  isLocation?: boolean;
  imageUrl?: string;
  isTemporary?: boolean; // Marca se a mensagem é temporária (usuário) ou permanente (admin)
}

// Cria ou recupera um chatId persistente por dispositivo (localStorage)
function getOrCreateChatId(): string {
    if (typeof window === 'undefined') return '';
    const storageKey = 'secret-chat-id';
    let chatId = localStorage.getItem(storageKey);
    if (!chatId) {
        const sessionId = Math.random().toString(36).substring(2, 12);
        const timestamp = Date.now();
        chatId = `secret-chat-${timestamp}-${sessionId}`;
        localStorage.setItem(storageKey, chatId);
        console.log(`[Chat Widget] Novo chat criado e salvo no localStorage: ${chatId}`);
    } else {
        console.log(`[Chat Widget] ChatId recuperado do localStorage: ${chatId}`);
    }
    return chatId;
}

interface SecretChatWidgetProps {
    isOpen: boolean;
}

export default function SecretChatWidget({ isOpen }: SecretChatWidgetProps) {
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const sessionMessages = useRef<Message[]>([]); // Mensagens só da sessão atual
    const sessionStart = useRef<number>(0); // Timestamp de início da sessão
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatId = useRef<string>('');

    const [showVideoCall, setShowVideoCall] = useState(false);


    useEffect(() => {
        if (isOpen && !chatId.current) {
            chatId.current = getOrCreateChatId();
            console.log(`[Chat Widget] Chat temporário iniciado: ${chatId.current}`);
        }
        if (isOpen) {
            sessionStart.current = Date.now();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setIsAuthenticating(true);
            if (user) {
                console.log('User already signed in:', user.uid, user.isAnonymous);
                setCurrentUser(user);
                setIsAuthenticating(false);
            } else {
                try {
                    console.log('Signing in anonymously...');
                    const userCredential = await signInAnonymously(auth);
                    console.log('Anonymous sign-in successful:', userCredential.user.uid, userCredential.user.isAnonymous);
                    setCurrentUser(userCredential.user);
                } catch (error: any) {
                    console.error('Error signing in anonymously:', error);
                    toast({
                        variant: 'destructive',
                        title: 'Erro de autenticação',
                        description: 'Não foi possível conectar ao chat. Recarregue a página.'
                    });
                } finally {
                    setIsAuthenticating(false);
                }
            }
        });
        
        return () => unsubscribeAuth();
    }, [isOpen, toast]);

    useEffect(() => {
        if (!currentUser || !chatId.current || !isOpen) {
            if (!isOpen) setIsLoading(true);
            return;
        }

        setIsLoading(true);

        // Detecta se é admin (ajuste conforme sua lógica de autenticação de admin)
        const isAdmin = currentUser.email && currentUser.email.endsWith('@admin.com');

        try {
            if (!db) throw new Error('Firebase não está inicializado');
            const chatDocRef = doc(db, 'chats', chatId.current);
            const messagesCollection = collection(chatDocRef, 'messages');
            const q = query(messagesCollection, orderBy('timestamp', 'asc'));

            // Limpa as mensagens da sessão ao abrir o chat e marca início da sessão
            if (!isAdmin) {
                sessionMessages.current = [];
            }

            const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
                const msgs: Message[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
                if (isAdmin) {
                    setMessages(msgs); // Admin vê tudo
                } else {
                    // Usuário só vê mensagens recebidas/enviadas durante a sessão
                    // Adiciona mensagens do admin recebidas APÓS o início da sessão
                    const newAdminMsgs = msgs.filter(m =>
                        m.senderId === 'admin' &&
                        !sessionMessages.current.some(sm => sm.id === m.id) &&
                        m.timestamp && m.timestamp.toMillis() >= sessionStart.current
                    );
                    if (newAdminMsgs.length > 0) {
                        sessionMessages.current = [...sessionMessages.current, ...newAdminMsgs];
                    }
                    setMessages([...sessionMessages.current]);
                }
                setIsLoading(false);
            }, (error) => {
                console.error("Erro ao buscar mensagens: ", error);
                setIsLoading(false);
                toast({
                    variant: 'destructive',
                    title: 'Erro no chat',
                    description: 'Não foi possível carregar as mensagens. Recarregue a página.'
                });
            });

            return () => {
                try {
                    unsubscribeMessages();
                } catch (error) {
                    console.error("Erro ao desinscrever listener:", error);
                }
            };
        } catch (error: any) {
            console.error("Erro ao inicializar chat:", error);
            setIsLoading(false);
            toast({
                variant: 'destructive',
                title: 'Erro no chat',
                description: `Erro ao inicializar: ${error.message || 'Erro desconhecido'}`
            });
        }
    }, [currentUser, isOpen, toast]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSendMessage = useCallback(async (text: string, options: { isLocation?: boolean; imageUrl?: string } = {}) => {
        const { isLocation = false, imageUrl = '' } = options;
        const trimmedMessage = text.trim();
        if ((trimmedMessage === '' && !imageUrl) || isSending || !currentUser || !chatId.current) return;
        setIsSending(true);
        try {
            if (!db) throw new Error('Firebase não está inicializado');
            const chatDocRef = doc(db, 'chats', chatId.current);
            const messagesCollection = collection(chatDocRef, 'messages');
            await setDoc(chatDocRef, { createdAt: serverTimestamp() }, { merge: true });
            // Cria mensagem local para sessão do usuário comum
            const localMsg: Message = {
                id: Math.random().toString(36).substring(2, 12),
                senderId: currentUser.uid,
                text: trimmedMessage,
                timestamp: Timestamp.now(),
                isLocation,
                imageUrl,
                isTemporary: true,
            };
            // Detecta se é admin (ajuste conforme sua lógica de autenticação de admin)
            const isAdmin = currentUser.email && currentUser.email.endsWith('@admin.com');
            if (!isAdmin) {
                sessionMessages.current.push(localMsg);
                setMessages([...sessionMessages.current]);
            }
            // Envia mensagem para o Firestore normalmente
            await addDoc(messagesCollection, {
                text: trimmedMessage,
                senderId: currentUser.uid,
                timestamp: serverTimestamp(),
                isLocation,
                imageUrl,
                isTemporary: true,
            });
            if (!isLocation && !imageUrl) setNewMessage('');
        } catch (error: any) {
            console.error("Erro ao enviar mensagem:", error);
            toast({ 
                variant: 'destructive', 
                title: 'Erro ao Enviar',
                description: `Falha ao enviar mensagem: ${error.message || 'Erro desconhecido'}`
            });
        } finally {
            setIsSending(false);
        }
    }, [isSending, currentUser, toast]);
    
    const sendLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast({ variant: 'destructive', title: 'Geolocalização não suportada.' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                const link = `https://maps.google.com/?q=${latitude},${longitude}`;
                handleSendMessage(link, { isLocation: true });
            },
            () => {
                toast({ variant: 'destructive', title: 'Não foi possível obter sua localização.' });
            }
        );
    }, [handleSendMessage, toast]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser || !chatId.current) {
            console.log('[File Upload] Validation failed:', {
                hasFile: !!file,
                hasUser: !!currentUser,
                hasChatId: !!chatId.current,
                userId: currentUser?.uid,
                isAnonymous: currentUser?.isAnonymous
            });
            return;
        }

        // Verificar se o usuário está realmente autenticado
        const user = auth.currentUser;
        console.log('[File Upload] Auth state check:', {
            authCurrentUser: user?.uid,
            isAnonymous: user?.isAnonymous,
            accessToken: user ? await user.getIdToken() : null,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            chatId: chatId.current
        });

        if (!user) {
            toast({ 
                variant: 'destructive', 
                title: 'Erro de autenticação', 
                description: 'Usuário não autenticado. Recarregue a página.' 
            });
            return;
        }

        setIsSending(true);
        toast({ title: "Enviando imagem..." });
        try {
            const storageRef = ref(storage, `chat_uploads/${chatId.current}/${Date.now()}_${file.name}`);
            console.log('[File Upload] Uploading to path:', storageRef.fullPath);
            
            await uploadBytes(storageRef, file);
            console.log('[File Upload] Upload successful, getting download URL...');
            
            const imageUrl = await getDownloadURL(storageRef);
            console.log('[File Upload] Download URL obtained:', imageUrl);
            
            await handleSendMessage(`Imagem: ${file.name}`, { imageUrl: imageUrl });
            toast({ title: "Imagem enviada com sucesso!" });
        } catch (error: any) {
            console.error("Erro ao enviar imagem:", error);
            console.error("Error details:", {
                code: error.code,
                message: error.message,
                serverResponse: error.serverResponse,
                customData: error.customData
            });
            
            let errorMessage = 'Erro desconhecido ao enviar imagem.';
            
            if (error.code === 'storage/unauthorized') {
                errorMessage = 'Sem permissão para fazer upload. Verifique a autenticação.';
            } else if (error.code === 'storage/canceled') {
                errorMessage = 'Upload cancelado.';
            } else if (error.code === 'storage/unknown') {
                errorMessage = 'Erro desconhecido no servidor Firebase.';
            } else if (error.code === 'storage/invalid-format') {
                errorMessage = 'Formato de arquivo inválido.';
            } else if (error.code === 'storage/invalid-checksum') {
                errorMessage = 'Erro na verificação do arquivo.';
            }
            
            toast({ 
                variant: 'destructive', 
                title: 'Erro ao enviar imagem', 
                description: errorMessage 
            });
        } finally {
            setIsSending(false);
            // Limpar o input file
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const renderMessageContent = (msg: Message) => {
        if (msg.imageUrl) {
            return (
                 <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                    <Image src={msg.imageUrl} alt="Imagem enviada" width={200} height={200} className="rounded-md max-w-full h-auto" />
                </a>
            );
        }
        if (msg.senderId === currentUser?.uid) {
            if (msg.isLocation && msg.text?.startsWith('http')) {
                 return (
                    <a href={msg.text} target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1 text-primary-foreground">
                        <MapPin className="h-4 w-4" /> Minha Localização
                    </a>
                );
            }
            return msg.text;
        }
        return msg.text;
    };
    
    if (!isOpen) return null;

    // Video call functionality temporarily disabled
    if (showVideoCall) {
        return (
            <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-xl mb-4">Chamada de vídeo temporariamente indisponível</p>
                    <Button onClick={() => setShowVideoCall(false)} variant="outline">
                        Fechar
                    </Button>
                </div>
            </div>
        );
    }


    // ...existing code...
    // Detecta se é admin
    const isAdmin = currentUser && currentUser.email && currentUser.email.endsWith('@admin.com');

    return (
        <div className={cn("fixed bottom-24 left-6 z-[1000] transition-all duration-300", isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none")}> 
            <Card className="w-[360px] h-[500px] max-w-md flex flex-col animate-in fade-in-0 zoom-in-95 duration-500 shadow-lg border-gray-400 bg-black/90 backdrop-blur-xl md:rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-center relative border-b border-gray-400">
                    <CardTitle className="text-xl text-white">
                        CHAT SECRETO
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                     {(isLoading || isAuthenticating) ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-10 w-10 animate-spin text-white"/>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === 'admin' ? 'justify-start' : 'justify-end')}>
                                {msg.senderId === 'admin' && (
                                    <div className="relative">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>A</AvatarFallback>
                                        </Avatar>
                                        <CheckCircle 
                                            className="absolute -bottom-1 -right-1 h-4 w-4 text-blue-500 bg-white rounded-full"
                                        />
                                    </div>
                                )}
                                <div className={cn(
                                    "max-w-xs md:max-w-md rounded-lg px-3 py-2 relative",
                                    msg.senderId === 'admin' ? 'bg-secondary text-secondary-foreground rounded-bl-sm' : 'bg-white text-black rounded-br-sm'
                                )}>
                                    <div className="text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {renderMessageContent(msg)}
                                    </div>
                                    <p className="text-xs text-right opacity-70 mt-1">
                                        {msg.timestamp?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Enviando...'}
                                    </p>
                                </div>
                                {msg.senderId !== 'admin' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                <CardFooter className="border-t border-gray-400 p-2.5 flex flex-col items-start gap-2">
                     <div className="flex w-full items-center space-x-1">
                        <Button variant="ghost" size="icon" className="text-white" onClick={() => setShowVideoCall(true)} disabled={!currentUser}><Video className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon" className="text-white" onClick={() => fileInputRef.current?.click()} disabled={!currentUser}><Paperclip className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon" className="text-white" onClick={sendLocation} disabled={!currentUser}><MapPin className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon" className="text-white" disabled><Mic className="h-5 w-5"/></Button>
                     </div>
                    <div className="flex w-full items-center space-x-2">
                        <Textarea
                            placeholder={isAuthenticating ? "Autenticando..." : "Mensagem..."}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(newMessage);
                                }
                            }}
                            className="flex-1 bg-gray-800 border-gray-600 focus:shadow-lg min-h-[40px] h-10 max-h-24 resize-none rounded-2xl px-4 text-white placeholder:text-neutral-400"
                            disabled={isSending || isAuthenticating}
                            rows={1}
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            onClick={() => handleSendMessage(newMessage)} 
                            disabled={isSending || newMessage.trim() === '' || isAuthenticating}
                            className="bg-white hover:bg-gray-200 text-black rounded-full w-10 h-10 flex-shrink-0"
                            aria-label="Enviar Mensagem"
                        >
                            {isAuthenticating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>
                    {/* Botão de exclusão visível apenas para admin */}
                    {isAdmin && chatId.current && (
                        <div className="w-full flex justify-end pt-2">
                            <DeleteSecretChatButton chatId={chatId.current} onDeleted={() => window.location.reload()} />
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
