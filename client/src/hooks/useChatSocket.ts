import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import socketClient from '../services/socketClient.js';
import type { 
  ChatMessage, 
  ChatRoom, 
  SendMessagePayload, 
  MessageSentResponse,
  UserTypingResponse,
  SocketErrorResponse 
} from '../types/socket.js';

export const useChatSocket = (storeId: number | null, buyerId: number | null) => {
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

  useEffect(() => {
    currentStoreId.current = storeId;
    currentBuyerId.current = buyerId;
  }, [storeId, buyerId]);

  const connectSocket = useCallback(() => {
    try {
      const socketInstance = socketClient.connect();
      setSocket(socketInstance);
      setIsConnected(socketInstance.connected);

      // Socket event listeners
      socketInstance.on('connect', () => {
        setIsConnected(true);
        setError(null);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        setIsJoined(false);
      });

      // Chat specific events
      socketInstance.on('chat_joined', (data: { messages: ChatMessage[] }) => {
        setMessages(data.messages || []);
        setIsJoined(true);
        setIsLoading(false);
      });

      socketInstance.on('chat_error', (errorData: SocketErrorResponse) => {
        setError(errorData.error);
        setIsJoined(false);
        setIsLoading(false);
      });

      socketInstance.on('message_sent', (data: MessageSentResponse) => {
        setMessages(prev => [...prev, data.message]);
      });

      socketInstance.on('user_typing', (data: UserTypingResponse) => {
        setOtherUserTyping(data.is_typing);
      });

      return socketInstance;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to socket');
      setIsLoading(false);
      return null;
    }
  }, []);

  const joinChat = useCallback((storeId: number, buyerId: number) => {
    if (!socket || !isConnected) {
      setError('Socket not connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    socket.emit('join_chat', { store_id: storeId, buyer_id: buyerId });
  }, [socket, isConnected]);

  const leaveChat = useCallback(() => {
    if (!socket || !currentStoreId.current || !currentBuyerId.current) return;

    socket.emit('leave_chat', { 
      store_id: currentStoreId.current, 
      buyer_id: currentBuyerId.current 
    });
    setIsJoined(false);
    setMessages([]);
    setOtherUserTyping(false);
  }, [socket]);

  const sendMessage = useCallback((message: string) => {
    if (!socket || !isConnected || !isJoined) {
      setError('Chat not connected');
      return;
    }

    if (!currentStoreId.current || !currentBuyerId.current) {
      setError('Store ID or Buyer ID not set');
      return;
    }

    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    const payload: SendMessagePayload = {
      store_id: currentStoreId.current,
      buyer_id: currentBuyerId.current,
      message: message.trim()
    };

    socket.emit('send_message', payload);
    setError(null);
  }, [socket, isConnected, isJoined]);

  const sendTyping = useCallback((typing: boolean) => {
    if (!socket || !isConnected || !isJoined) return;
    if (!currentStoreId.current || !currentBuyerId.current) return;

    socket.emit('typing', {
      store_id: currentStoreId.current,
      buyer_id: currentBuyerId.current,
      is_typing: typing
    });

    setIsTyping(typing);

    // Auto stop typing after 3 seconds
    if (typing) {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
      
      typingTimer.current = window.setTimeout(() => {
        sendTyping(false);
      }, 3000);
    } else {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
        typingTimer.current = null;
      }
    }
  }, [socket, isConnected, isJoined]);

  // Auto join chat when storeId and buyerId are available
  useEffect(() => {
    if (!storeId || !buyerId) {
      setMessages([]);
      setIsJoined(false);
      return;
    }

    if (!socket) {
      connectSocket();
      return;
    }

    if (isConnected && !isJoined && !isLoading) {
      joinChat(storeId, buyerId);
    }

    return () => {
      leaveChat();
    };
  }, [storeId, buyerId, socket, isConnected, isJoined, isLoading, connectSocket, joinChat, leaveChat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
      leaveChat();
    };
  }, [leaveChat]);

  return {
    // State
    messages,
    isConnected,
    isJoined,
    isLoading,
    error,
    isTyping,
    otherUserTyping,
    
    // Actions
    sendMessage,
    sendTyping,
    joinChat,
    leaveChat,
    connectSocket,
    
    // Utils
    clearError: () => setError(null),
    clearMessages: () => setMessages([])
  };
};