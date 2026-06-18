import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import socketClient from '../services/socketClient.js';
import type { ChatMessage, SocketErrorResponse } from '../types/socket.js';

export const useChatSocket = (
  storeId: number | null, 
  buyerId: number | null,
  onNewMessage?: (message: any) => void,
  currentUserId?: number | null
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
  const currentUserIdRef = useRef(currentUserId);
  const typingTimer = useRef<number | null>(null);

  const onNewMessageRef = useRef(onNewMessage);
  
  // Notification queue
  const notificationQueue = useRef<any[]>([]);
  const isProcessingNotification = useRef(false);
  
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  // Update user ID ref (room refs managed in join_chat useEffect)
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
    
    // Ensure user joins notification room when userId is available/changes
    if (socket && isConnected && currentUserId) {
      console.log('[Socket] Ensuring user notification room join: user_' + currentUserId);
      socket.emit('join_user_room', { userId: currentUserId });
    }
  }, [currentUserId, socket, isConnected]);

  const connectSocket = useCallback(() => {
    try {
      const socketInstance = socketClient.connect(); 
      setSocket(socketInstance);
      setIsConnected(socketInstance.connected);

      socketInstance.on('connect', () => {
        console.log('[Socket] Connected, ID:', socketInstance.id);
        setIsConnected(true);
        setError(null);
        
        // Join user notification room for global notifications
        // Note: currentUserIdRef might not be set yet on first connect
        // We'll also join in a separate useEffect when currentUserId is available
        if (currentUserIdRef.current) {
          console.log('[Socket] Joining user notification room on connect: user_' + currentUserIdRef.current);
          socketInstance.emit('join_user_room', { userId: currentUserIdRef.current });
        } else {
          console.warn('[Socket] currentUserIdRef not set yet on connect');
        }
      });

      socketInstance.on('disconnect', () => {
        console.log('[Socket] Disconnected');
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
           product_name: payload.product_name,
           product_price: payload.product_price,
           product_image: payload.product_image,
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
                // Cari pesan 'pending' (message_id yang temporary - biasanya timestamp besar)
                // yang sender_id-nya sama dengan sender pesan baru dan kontennya sama
                const optimisticIndex = [...prev].reverse().findIndex(m => 
                    m.message_id > 1000000000000 && // Temporary ID (timestamp)
                    m.sender_id === newMessage.sender_id && 
                    m.content === newMessage.content &&
                    m.message_type === newMessage.message_type
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

        // Note: onNewMessage callback is handled by chat_sidebar_update event
        // to avoid duplicate sidebar updates
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
            is_read: msg.is_read,
            product_id: msg.product_id,
            product_name: msg.product_name,
            product_price: msg.product_price,
            product_image: msg.product_image
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
          product_name: payload.product_name,
          product_price: payload.product_price,
          product_image: payload.product_image,
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

      // Handle read receipts
      socketInstance.on('messages_read', (data: { storeId: number; buyerId: number; readBy: number }) => {
        const isCurrentRoom = 
          currentStoreId.current === data.storeId && 
          currentBuyerId.current === data.buyerId;
        
        if (isCurrentRoom) {
          console.log('[Read Receipt] Messages read by:', data.readBy, 'Current user:', currentUserIdRef.current);
          // Mark messages yang DIKIRIM OLEH current user (bukan yang dibaca) dan DIBACA OLEH lawan bicara
          setMessages(prev => prev.map(msg => {
            // Only mark as read if:
            // 1. Message was sent by current user (msg.sender_id === currentUserIdRef.current)
            // 2. Message was read by someone else (data.readBy !== currentUserIdRef.current)
            if (msg.sender_id === currentUserIdRef.current && data.readBy !== currentUserIdRef.current) {
              return { ...msg, is_read: true };
            }
            return msg;
          }));
        }
      });

      // Handle sidebar updates (ALWAYS received for all new messages)
      socketInstance.on('chat_sidebar_update', (data: any) => {
        console.log('[Sidebar Update] Received:', data);
        console.log('[Sidebar Update] Current user:', currentUserIdRef.current);
        
        const messageData = data.message;
        
        // ALWAYS update sidebar with new message, regardless of current room
        if (messageData && onNewMessageRef.current) {
          console.log('[Sidebar Update] Calling handleNewMessage to update sidebar');
          onNewMessageRef.current(messageData);
        } else {
          console.warn('[Sidebar Update] Missing messageData or callback');
        }
      });

      // Handle push notifications with queue (ONLY when not in active chat)
      socketInstance.on('new_chat_notification', (data: any) => {
        console.log('[Push Notification] Received:', data);
        console.log('[Push Notification] Current user:', currentUserIdRef.current);
        console.log('[Push Notification] Data.data:', data.data);
        
        // Add to queue for display
        notificationQueue.current.push(data);
        
        // Process queue if not already processing
        if (!isProcessingNotification.current) {
          const processNext = () => {
            if (notificationQueue.current.length === 0) {
              isProcessingNotification.current = false;
              return;
            }
            
            isProcessingNotification.current = true;
            const notification = notificationQueue.current.shift();
            
            if (notification) {
              console.log('Processing notification:', notification);
              
              // Try service worker first (preferred method)
              if ('serviceWorker' in navigator && 'registration' in navigator.serviceWorker) {
                navigator.serviceWorker.ready.then((registration) => {
                  if (registration.active) {
                    registration.active.postMessage({
                      type: 'SHOW_NOTIFICATION',
                      notification: {
                        title: notification.title,
                        options: {
                          body: notification.body,
                          icon: '/favicon.ico',
                          badge: '/favicon.ico',
                          data: notification.data || {}
                        }
                      }
                    });
                    // Wait 500ms before processing next notification
                    setTimeout(() => processNext(), 500);
                  } else {
                    // Fallback to Web Notification API if service worker not active
                    showWebNotification(notification);
                    setTimeout(() => processNext(), 500);
                  }
                }).catch(err => {
                  console.error('Service worker error:', err);
                  // Fallback to Web Notification API
                  showWebNotification(notification);
                  setTimeout(() => processNext(), 500);
                });
              } else {
                // No service worker, use Web Notification API
                showWebNotification(notification);
                setTimeout(() => processNext(), 500);
              }
            } else {
              isProcessingNotification.current = false;
            }
          };
          
          // Helper function to show web notification
          const showWebNotification = (notification: any) => {
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(notification.title, {
                  body: notification.body,
                  icon: '/favicon.ico',
                  data: notification.data || {}
                });
              } catch (err) {
                console.error('Notification error:', err);
              }
            }
          };
          
          processNext();
        }
      });

      return socketInstance;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to socket');
      setIsLoading(false);
      return null;
    }
  }, []); // Dependency Kosong = Stabil

  // Auto connect and setup cleanup
  useEffect(() => {
    const sock = connectSocket();
    
    // Cleanup function to remove all listeners
    return () => {
      if (sock) {
        console.log('[Socket] Cleaning up event listeners');
        sock.off('connect');
        sock.off('disconnect');
        sock.off('new_message');
        sock.off('partner_typing');
        sock.off('chat_joined');
        sock.off('message_sent');
        sock.off('chat_error');
        sock.off('messages_read');
        sock.off('chat_sidebar_update');
        sock.off('new_chat_notification');
      }
    };
  }, [connectSocket]);

  // sendMessage dengan dukungan text/image/item_preview
  const sendMessage = useCallback((message: string, type: 'text' | 'image' | 'item_preview' = 'text', productId?: number) => {
    if (!socket || !isConnected) {
         console.warn("[useChatSocket] Cannot send: Socket not connected");
         return;
    }
    if (!currentStoreId.current) return;

    const payload = {
      storeId: currentStoreId.current,
      buyerId: currentBuyerId.current,
      message,
      type,
      productId
    };

    socket.emit('send_message', payload);
    
    // Optimistic Update - use actual current user ID
    // Don't show optimistic for item_preview as it will show "Product Preview" without actual product data
    if (type !== 'item_preview') {
      const optimisticMessage: ChatMessage = {
        message_id: Date.now(), // ID sementara
        store_id: currentStoreId.current,
        buyer_id: currentBuyerId.current || 0,
        sender_id: currentUserIdRef.current || 0, 
        content: message,
        message_type: type,
        product_id: productId ?? (null as any),
        is_read: false,
        created_at: new Date().toISOString()
      };
      
      setMessages((prev: ChatMessage[]) => [...prev, optimisticMessage]);
    }
  }, [socket, isConnected]);

  const sendTyping = useCallback((typing: boolean) => {
     if (!socket || !isConnected || !currentStoreId.current) return;
     const event = typing ? 'typing' : 'stop_typing';
     socket.emit(event, { 
        storeId: currentStoreId.current,
        buyerId: currentBuyerId.current
     });
  }, [socket, isConnected]);

  // Auto join logic
  useEffect(() => {
    if (storeId && buyerId && isConnected && socket) {
       console.log('[Auto Join] Joining room:', storeId, buyerId);
       // SET REFS IMMEDIATELY before join to avoid race with notifications
       currentStoreId.current = storeId;
       currentBuyerId.current = buyerId;
       socket.emit('join_chat', { storeId, buyerId });
       
       // Cleanup: leave room when component unmounts or room changes
       return () => {
         console.log('[Auto Join] Leaving room:', storeId, buyerId);
         socket.emit('leave_chat', { storeId, buyerId });
         // Only clear refs if we're actually leaving (not just unmounting during hot reload)
         if (currentStoreId.current === storeId && currentBuyerId.current === buyerId) {
           currentStoreId.current = null;
           currentBuyerId.current = null;
         }
       };
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
         is_read: msg.is_read,
         product_id: msg.product_id,
         product_name: msg.product_name,
         product_price: msg.product_price,
         product_image: msg.product_image
      }));

      // Prepend (tambah di depan) pesan lama
      setMessages((prev: ChatMessage[]) => [...formattedOldMessages, ...prev]);
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