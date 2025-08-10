
"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  text: string;
  senderId: 'user' | 'admin';
  timestamp: Timestamp | null;
  originalText?: string;
  imageUrl?: string;
}

interface ChatData {
    userLanguage?: string;
}

export default function AdminChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;

  const currentUser = 'admin';

  useEffect(() => {
    if (!chatId) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    
    try {
        const chatDocRef = doc(db, 'chats', chatId);
        const messagesCollection = collection(chatDocRef, 'messages');
        
        // Subscribe to chat metadata
        const unsubChat = onSnapshot(chatDocRef, (doc) => {
            if (doc.exists()) {
                setChatData(doc.data() as ChatData);
            }
        }, (error) => {
            console.error("Erro ao buscar dados do chat:", error);
        });

        // Subscribe to messages
        const q = query(messagesCollection, orderBy('timestamp', 'asc'));
        const unsubMessages = onSnapshot(q, (querySnapshot) => {
          const msgs: Message[] = [];
          querySnapshot.forEach((doc) => {
            msgs.push({ id: doc.id, ...doc.data() } as Message);
          });
          setMessages(msgs);
          setIsLoading(false);
        }, (error) => {
            console.error("Erro ao buscar mensagens: ", error);
            setIsLoading(false);
        });

        return () => {
            try {
                unsubChat();
                unsubMessages();
            } catch (error) {
                console.error("Erro ao desinscrever listeners:", error);
            }
        };
    } catch (error) {
        console.error("Erro ao inicializar chat:", error);
        setIsLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || isSending || !chatId) return;
  
    setIsSending(true);
    
    try {
        // Verificar se o Firebase está inicializado
        if (!db) {
            throw new Error('Firebase não está inicializado');
        }

        const chatDocRef = doc(db, 'chats', chatId);
        const messagesCollection = collection(chatDocRef, 'messages');
        
        // Enviar mensagem sem tradução - apenas o texto original
        await addDoc(messagesCollection, {
            text: newMessage.trim(), // Texto original sem tradução
            senderId: currentUser,
            timestamp: serverTimestamp(),
            isTemporary: false, // Mensagens do admin são permanentes
        });

        setNewMessage('');
    } catch (error: any) {
        console.error("Erro ao enviar mensagem:", error);
        // Adicionar toast de erro se disponível
        alert(`Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}`);
    } finally {
        setIsSending(false);
    }
  };

  const getMessageToDisplay = (msg: Message) => {
      // Sempre mostrar apenas o texto original, sem tradução
      return msg.text;
  };

  const renderMessageContent = (msg: Message) => {
      if (msg.imageUrl) {
          return (
              <div className="space-y-2">
                  <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                      <Image 
                          src={msg.imageUrl} 
                          alt="Imagem enviada" 
                          width={200} 
                          height={200} 
                          className="rounded-md max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity" 
                      />
                  </a>
                  {msg.text && !msg.text.startsWith('Imagem: ') && (
                      <p className="text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {getMessageToDisplay(msg)}
                      </p>
                  )}
              </div>
          );
      }
      return (
          <p className="text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {getMessageToDisplay(msg)}
          </p>
      );
  };

  const getTooltipContent = (msg: Message) => {
      // Sem tooltips de tradução
      return null;
  };

  if (!chatId) {
    return (
        <Card className="w-full h-[85vh] flex flex-col items-center justify-center">
            <CardContent>
                <p className="text-muted-foreground">ID do chat inválido.</p>
            </CardContent>
        </Card>
    );
  }

  const getChatParticipantName = (chatId: string) => {
    if (chatId.startsWith('secret-chat-')) {
      return `Cliente ${chatId.substring(12)}`;
    }
    return chatId;
  }

  return (
    <Card className="w-full h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/conversations')}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl">
                Chat com {getChatParticipantName(chatId)}
                {chatData?.userLanguage && <span className="text-sm text-muted-foreground ml-2">({chatData.userLanguage})</span>}
            </CardTitle>
            <div className="w-9 h-9" />
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
             <TooltipProvider>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === currentUser ? 'justify-end' : 'justify-start')}>
                                {msg.senderId !== currentUser && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                )}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={cn(
                                            "max-w-xs md:max-w-md rounded-lg px-4 py-2 relative",
                                            msg.senderId === currentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                                        )}>
                                            {renderMessageContent(msg)}
                                            <p className="text-xs text-right opacity-70 mt-1">
                                                {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Enviando...'}
                                            </p>
                                        </div>
                                    </TooltipTrigger>
                                    {getTooltipContent(msg) && (
                                        <TooltipContent>
                                            <p>{getTooltipContent(msg)}</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>

                                {msg.senderId === currentUser && (
                                    <div className="relative">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{currentUser === 'admin' ? 'A' : 'U'}</AvatarFallback>
                                        </Avatar>
                                        {currentUser === 'admin' && (
                                            <CheckCircle 
                                                className="absolute -bottom-1 -right-1 h-4 w-4 text-blue-500 bg-white rounded-full"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
             </TooltipProvider>
        </CardContent>
        <CardFooter className="border-t p-4">
            <div className="flex w-full items-center space-x-2">
                <Textarea 
                    placeholder="Digite sua mensagem..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                     onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    className="flex-1 bg-input min-h-[40px] h-10 max-h-24 resize-none"
                    disabled={isSending || isLoading}
                    rows={1}
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    onClick={handleSendMessage} 
                    disabled={isSending || isLoading || newMessage.trim() === ''}
                    className="self-end"
                >
                    <Send className="h-5 w-5" />
                    <span className="sr-only">Enviar</span>
                </Button>
            </div>
        </CardFooter>
      </Card>
  );
}
