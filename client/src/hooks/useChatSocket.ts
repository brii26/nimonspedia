import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import socketClient from '../services/socketClient.js';
import type { ChatMessage, SocketErrorResponse } from '../types/socket.js';

// Tambahkan param onNewMessage agar Page bisa update Sidebar
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

  const currentStoreId = useRef(storeId);
  const currentBuyerId = useRef(buyerId);
  const typingTimer = useRef<number | null>(null);

  // Update ref saat props berubah
  useEffect(() => {
    currentStoreId.current = storeId;
    currentBuyerId.current = buyerId;
  }, [storeId, buyerId]);

  const connectSocket = useCallback(() => {
    try {
      // Pastikan socketClient.connect() mengembalikan instance singleton
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

      // --- FIX 1: Event Listener Standard (new_message) ---
      // Listener ini menangani pesan masuk untuk Room yang aktif
      socketInstance.on('new_message', (payload: any) => {
        // Normalisasi data (Server mungkin kirim snake_case, kita butuh camelCase/consistent structure)
        const newMessage: ChatMessage = {
           message_id: payload.message_id || Date.now(),
           store_id: payload.store_id,
           buyer_id: payload.buyer_id,
           sender_id: payload.sender_id,
           content: payload.content || payload.message_text || payload.message, // Handle variasi naming
           message_type: payload.type || payload.message_type || 'text',
           product_id: payload.product_id,
           is_read: false,
           created_at: payload.created_at || new Date().toISOString()
        };

        // 1. Update State Pesan Lokal (Hanya jika pesan ini milik room yang sedang dibuka)
        // Cek apakah room yang aktif sesuai dengan pesan yang masuk
        const isCurrentRoom = 
            (currentStoreId.current === newMessage.store_id && currentBuyerId.current === newMessage.buyer_id);

        if (isCurrentRoom) {
             setMessages(prev => [...prev, newMessage]);
        }

        // 2. Callback ke Parent (ChatPage) untuk update Sidebar/Notifikasi
        if (onNewMessage) {
            onNewMessage(newMessage);
        }
      });

      // --- FIX 2: Event Listener Typing ---
      socketInstance.on('partner_typing', (data: any) => { // Server emit 'partner_typing'
        setOtherUserTyping(data.isTyping);
      });

      socketInstance.on('chat_joined', (data: { messages: any[] }) => {
        // Mapping message history dari server ke format Client
        const formattedMessages = (data.messages || []).map(msg => ({
            message_id: msg.message_id,
            store_id: storeId || 0, // Fallback
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
  }, [onNewMessage]); // Dependency onNewMessage penting

  const joinChat = useCallback((sId: number, bId: number) => {
    if (!socket) return;
    setIsLoading(true);
    // FIX 3: Payload Naming (CamelCase sesuai request server di chatSocket.ts)
    socket.emit('join_chat', { storeId: sId, buyerId: bId });
  }, [socket]);

  const sendMessage = useCallback((message: string) => {
    if (!socket || !isConnected) return;

    if (!currentStoreId.current) { 
      console.error("Store ID hilang, tidak bisa kirim pesan");
      return; 
    }
    const payload = {
      storeId: currentStoreId.current,
      buyerId: currentBuyerId.current,
      message: message,
      type: 'text'
    };

    socket.emit('send_message', payload);
    
  }, [socket, isConnected]);

  const sendMessagePayload = useCallback((payload: any) => {
    if(!socket) return;
    socket.emit('send_message', payload);
  }, [socket, isConnected]);

  const sendTyping = useCallback((typing: boolean) => {
     if (!socket || !isConnected) return;
     if (!currentStoreId.current) return;

     const event = typing ? 'typing' : 'stop_typing';
     
     socket.emit(event, { 
        storeId: currentStoreId.current,
        buyerId: currentBuyerId.current
     });
  }, [socket, isConnected]);

  // Auto connect
  useEffect(() => {
     const sock = connectSocket();
     return () => {
        // Cleanup listener if needed
        // socket.disconnect() is handled by socketClient usually
     };
  }, [connectSocket]);

  // Auto join logic (Jika storeId & buyerId berubah)
  useEffect(() => {
    if (storeId && buyerId && isConnected) {
       joinChat(storeId, buyerId);
    }
  }, [storeId, buyerId, isConnected, joinChat]);

  return {
    messages,
    isConnected,
    isJoined,
    isLoading,
    error,
    otherUserTyping, // Info partner ngetik
    sendMessage,     // Legacy string
    sendMessagePayload,
    sendTyping,
    socket
  };
};