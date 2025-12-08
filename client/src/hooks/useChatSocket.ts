import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import socketClient from '../services/socketClient.js';
import type { ChatMessage, SocketErrorResponse } from '../types/socket.js';

export const useChatSocket = (
  storeId: number | null, 
  buyerId: number | null,
  onNewMessage?: (message: any) => void 
) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const currentStoreId = useRef(storeId);
  const currentBuyerId = useRef(buyerId);
  const typingTimer = useRef<number | null>(null);

  const onNewMessageRef = useRef(onNewMessage);
  
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  // Update ref saat props ID berubah
  useEffect(() => {
    currentStoreId.current = storeId;
    currentBuyerId.current = buyerId;
  }, [storeId, buyerId]);

  const connectSocket = useCallback(() => {
    try {
      const socketInstance = socketClient.connect(); 
      setSocket(socketInstance);
      setIsConnected(socketInstance.connected);

      socketInstance.on('connect', () => {
        setIsConnected(true);
        setError(null);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        setIsJoined(false);
      });

      socketInstance.on('new_message', (payload: any) => {
        // 1. Normalisasi data pesan
        const newMessage: ChatMessage = {
           message_id: payload.message_id || Date.now(),
           store_id: payload.store_id,
           buyer_id: payload.buyer_id,
           sender_id: payload.sender_id,
           content: payload.content || payload.message_text || payload.message,
           message_type: payload.type || payload.message_type || 'text',
           product_id: payload.product_id,
           is_read: false,
           created_at: payload.created_at || new Date().toISOString()
        };

        const isCurrentRoom = 
             (currentStoreId.current === newMessage.store_id && currentBuyerId.current === newMessage.buyer_id);

        if (isCurrentRoom) {
             setMessages(prev => {
                // A. Cek Duplikat ID Asli (Safety Check)
                // Jika pesan dengan ID database ini sudah ada, abaikan.
                if (prev.some(m => m.message_id === newMessage.message_id)) {
                    return prev;
                }

                // B. Cek Pesan Optimistic
                // Cari pesan 'pending' (sender_id 0) yang kontennya sama
                const optimisticIndex = [...prev].reverse().findIndex(m => 
                    m.sender_id === 0 && m.content === newMessage.content
                );

                if (optimisticIndex !== -1) {
                    const originalIndex = prev.length - 1 - optimisticIndex;
                    const newState = [...prev];
                    newState[originalIndex] = newMessage;
                    return newState;
                }

                // C. Pesan Baru Murni (Dari Lawan Bicara)
                return [...prev, newMessage];
             });
        }

        if (onNewMessageRef.current) {
            onNewMessageRef.current(newMessage);
        }
      });

      socketInstance.on('partner_typing', (data: any) => {
        setOtherUserTyping(data.isTyping);
      });

      socketInstance.on('chat_joined', (data: { messages: any[] }) => {
        const formattedMessages = (data.messages || []).map(msg => ({
            message_id: msg.message_id,
            store_id: storeId || 0,
            buyer_id: buyerId || 0,
            sender_id: msg.sender_id,
            content: msg.content || msg.message_text,
            message_type: msg.type || msg.message_type || 'text',
            created_at: msg.created_at,
            is_read: msg.is_read
        }));
        setMessages(formattedMessages);
        setIsJoined(true);
        setIsLoading(false);
      });

      // Listener message_sent untuk konfirmasi pengiriman (update ID asli dari server)
      socketInstance.on('message_sent', (payload: any) => {
        const isCurrentRoom =
          currentStoreId.current === payload.store_id &&
          currentBuyerId.current === payload.buyer_id;
        if (!isCurrentRoom) return;

        // Cek jika pesan ini adalah update dari optimistic UI (biasanya pakai ID temp)
        // Di sini kita simplifikasi: append jika belum ada, atau replace jika logic ID mendukung
        const msg: ChatMessage = {
          message_id: payload.message_id,
          store_id: payload.store_id,
          buyer_id: payload.buyer_id,
          sender_id: payload.sender_id,
          content: payload.content,
          message_type: payload.message_type || 'text',
          product_id: payload.product_id,
          is_read: payload.is_read ?? false,
          created_at: payload.created_at || new Date().toISOString(),
        };

        setMessages(prev => {
            // Hindari duplikat jika backend kirim balik pesan yang sama
            if (prev.some(m => m.message_id === msg.message_id)) return prev;
            return [...prev, msg];
        });
      });

      socketInstance.on('chat_error', (errorData: any) => {
        console.error("Socket Error:", errorData);
        setError(errorData.message || 'Chat error');
        setIsLoading(false);
      });

      return socketInstance;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to socket');
      setIsLoading(false);
      return null;
    }
  }, []); // Dependency Kosong = Stabil

  // sendMessage, sendTyping, dll sama seperti kode Anda...

  const sendMessage = useCallback((message: string) => {
    // ... (Kode sendMessage Anda sudah benar)
    if (!socket || !isConnected) {
         console.warn("[useChatSocket] Cannot send: Socket not connected");
         return;
    }
    if (!currentStoreId.current) return;

    const payload = {
      storeId: currentStoreId.current,
      buyerId: currentBuyerId.current,
      message: message,
      type: 'text'
    };

    socket.emit('send_message', payload);
    
    // Optimistic Update
    const optimisticMessage: ChatMessage = {
      message_id: Date.now(), // ID sementara
      store_id: currentStoreId.current,
      buyer_id: currentBuyerId.current || 0,
      sender_id: 0, 
      content: message,
      message_type: 'text',
      product_id: null as any,
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    setMessages((prev: ChatMessage[]) => [...prev, optimisticMessage]);
  }, [socket, isConnected]);

  const sendTyping = useCallback((typing: boolean) => {
     if (!socket || !isConnected || !currentStoreId.current) return;
     const event = typing ? 'typing' : 'stop_typing';
     socket.emit(event, { 
        storeId: currentStoreId.current,
        buyerId: currentBuyerId.current
     });
  }, [socket, isConnected]);

  // Auto connect
  useEffect(() => {
     const sock = connectSocket();
     return () => {};
  }, [connectSocket]);

  // Auto join logic
  useEffect(() => {
    if (storeId && buyerId && isConnected && socket) {
       socket.emit('join_chat', { storeId, buyerId });
    }
  }, [storeId, buyerId, isConnected, socket]);

  const loadMoreMessages = useCallback((beforeId: number) => {
    if (!socket || !isConnected || !currentStoreId.current || isLoadingMore) return;
    
    setIsLoadingMore(true);
    socket.emit('load_more_messages', {
      storeId: currentStoreId.current,
      buyerId: currentBuyerId.current,
      beforeId,
      limit: 50
    });
  }, [socket, isConnected, isLoadingMore]);

  // Listener balasan server
  useEffect(() => {
    if (!socket) return;

    socket.on('more_messages_loaded', (data: { messages: any[], hasMore: boolean }) => {
      const formattedOldMessages = data.messages.map(msg => ({
         message_id: msg.message_id,
         store_id: currentStoreId.current || 0,
         buyer_id: currentBuyerId.current || 0,
         sender_id: msg.sender_id,
         content: msg.content,
         message_type: msg.message_type || 'text',
         created_at: msg.created_at,
         is_read: msg.is_read
      }));

      // Prepend (tambah di depan) pesan lama
      setMessages(prev => [...formattedOldMessages, ...prev]);
      setHasMore(data.hasMore);
      setIsLoadingMore(false);
    });

    return () => {
      socket.off('more_messages_loaded');
    };
  }, [socket]);

  return {
    messages,
    isConnected,
    isJoined,
    isLoading,
    loadMoreMessages,
    hasMore,
    isLoadingMore,
    error,
    otherUserTyping,
    sendMessage,
    sendTyping,
    socket
  };
};