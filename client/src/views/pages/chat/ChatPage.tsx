// client/src/views/pages/chat/ChatPage.tsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import api from '../../../services/api/axios.js';
import { useChatSocket } from '../../../hooks/useChatSocket.js'; 

// --- UI Components ---
import Card from '../../components/ui/Card.js';
import Button from '../../components/ui/Button.js';
import Input from '../../components/ui/Input.js';
import Avatar from '../../components/ui/Avatar.js';
import TypingIndicator from '../../components/ui/TypingIndicator.js';

// --- Helper Function: Format Waktu ---
const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return 'Baru saja';
  if (diffInSeconds < 60) return `${diffInSeconds} detik lalu`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  
  // Format jam:menit (misal 14:30) untuk pesan hari ini
  if (diffInSeconds < 86400) {
      return new Intl.DateTimeFormat('id-ID', { 
        hour: '2-digit', minute: '2-digit' 
      }).format(date);
  }

  return new Intl.DateTimeFormat('id-ID', { 
    day: 'numeric', month: 'short', year: 'numeric' 
  }).format(date);
};

// --- Interfaces ---
interface ChatRoom {
  room_id: string; 
  store_id: number;
  buyer_id: number;
  store_name: string;
  buyer_name: string;
  store_image?: string;
  buyer_image?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const ChatPage = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // State UI
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [shouldAutoSelect, setShouldAutoSelect] = useState(false);
  const [autoSelectRoomId, setAutoSelectRoomId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatDisabled, setIsChatDisabled] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [searchProducts, setSearchProducts] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load products when modal opens
  useEffect(() => {
    if (showProductModal) {
      // Load all products initially
      searchProductsForPreview('');
    } else {
      // Clear products when modal closes
      setSearchProducts([]);
      setProductSearch('');
    }
  }, [showProductModal]);

  // Load stores when new chat modal opens
  useEffect(() => {
    if (showNewChatModal) {
      fetchStores('');
    } else {
      setStores([]);
      setStoreSearch('');
    }
  }, [showNewChatModal]);

  // --- Callback Update Sidebar ---
  const handleNewMessage = useCallback((msg: any) => {
    setRooms((prevRooms: ChatRoom[]) => {
      const targetRoomId = `chat_${msg.store_id}_${msg.buyer_id}`;
      const targetRoom = prevRooms.find((r: ChatRoom) => r.room_id === targetRoomId);
      const otherRooms = prevRooms.filter((r: ChatRoom) => r.room_id !== targetRoomId);
      
      if (targetRoom) {
        return [{
          ...targetRoom,
          last_message: msg.content,
          last_message_time: msg.created_at,
          unread_count: (activeRoom?.room_id === targetRoomId) ? 0 : targetRoom.unread_count + 1
        }, ...otherRooms];
      }
      return prevRooms;
    });
  }, [activeRoom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    
    // Trigger load more ketika scroll position dekat top (dalam 100px)
    if (element.scrollTop < 100 && hasMore && !isLoadingMore && messages.length > 0) {
      const oldestMessage = messages[0];
      if (oldestMessage) {
        console.log('[ChatPage] Loading more messages, oldest ID:', oldestMessage.message_id);
        loadMoreMessages(oldestMessage.message_id);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file); // key "file" sesuai backend req.file()

    try {
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data.data?.url) {
        // Kirim pesan tipe image dengan URL hasil upload
        sendMessage(res.data.data.url, 'image');
      }
    } catch (err) {
      console.error("Upload gagal:", err);
      alert("Gagal mengupload gambar");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchStores = async (query: string = '') => {
    setIsLoadingStores(true);
    try {
      const searchParam = query ? `search=${encodeURIComponent(query)}&` : '';
      const res = await axios.get(`/api/stores?${searchParam}page=1&limit=20`);
      
      if (res.data?.success && res.data?.data) {
        setStores(res.data.data);
      } else if (Array.isArray(res.data)) {
        setStores(res.data);
      } else {
        setStores([]);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
      setStores([]);
    } finally {
      setIsLoadingStores(false);
    }
  };

  const handleStartNewChat = async (storeId: number) => {
    try {
      const res = await api.post('/chat/initiate', { storeId });
      if (res.data.success) {
        const roomData = res.data.data;
        const roomId = roomData.room_id || `chat_${roomData.store_id}_${roomData.buyer_id}`;
        
        const newRoom: ChatRoom = {
          room_id: roomId,
          store_id: Number(roomData.store_id),
          buyer_id: Number(roomData.buyer_id),
          store_name: roomData.store_name,
          buyer_name: roomData.buyer_name || user!.name,
          store_image: roomData.store_logo_path,
          buyer_image: roomData.buyer_image || '',
          last_message: '',
          last_message_time: new Date().toISOString(),
          unread_count: 0
        };

        setRooms((prev) => {
          if (prev.find(r => r.room_id === roomId)) return prev;
          return [newRoom, ...prev];
        });
        setActiveRoom(newRoom);
        setShowNewChatModal(false);
        setStoreSearch('');
      }
    } catch (err) {
      console.error('Failed to initiate chat:', err);
    }
  };

  const searchProductsForPreview = async (query: string = '') => {
    // Clear previous timeout
    if (productSearchTimeoutRef.current) {
      clearTimeout(productSearchTimeoutRef.current);
    }
    
    // Debounce search (only if user is typing)
    const delay = query.length > 0 ? 300 : 0;
    
    productSearchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        // Use /api/products endpoint for JSON response
        const searchParam = query ? `search=${encodeURIComponent(query)}&` : '';
        const limit = query ? 10 : 20;
        const url = `/api/products?${searchParam}page=1&limit=${limit}`;
        
        console.log('[Product Search] Fetching from:', url);
        const res = await axios.get(url);
        console.log('[Product Search] Response:', res.data);
        
        // Parse response from PHP backend
        let products = [];
        
        if (res.data?.success && res.data?.data) {
          // Expected format: { success: true, data: [...] }
          products = res.data.data;
        } else if (Array.isArray(res.data)) {
          products = res.data;
        }
        
        console.log('[Product Search] Products found:', products.length);
        setSearchProducts(products);
        
      } catch (err: any) {
        console.error("[Product Search] Error:", err);
        console.error("[Product Search] Response:", err.response?.data);
        setSearchProducts([]);
      } finally {
        setIsSearchingProducts(false);
      }
    }, delay);
  };

  const handleSendProductPreview = (product: any) => {
    if (!product.product_id) return;
    sendMessage('', 'item_preview', product.product_id);
    setShowProductModal(false);
    setProductSearch('');
    setSearchProducts([]);
  };
  
  const getThumbUrl = (url: string) => {
      if (!url) return '';
      const lastDotIndex = url.lastIndexOf('.');
      if (lastDotIndex === -1) return url;
      // Menyisipkan "_thumb" sebelum ekstensi
      return url.substring(0, lastDotIndex) + '_thumb' + url.substring(lastDotIndex);
  };

  // --- Init Hook ---
  const { 
    messages, 
    sendMessage, 
    sendTyping,
    otherUserTyping,
    isLoading, 
    loadMoreMessages,
    hasMore,          
    isLoadingMore,
    socket,
    isConnected,
    error: socketError
  } = useChatSocket(
    activeRoom ? activeRoom.store_id : null, 
    activeRoom ? activeRoom.buyer_id : null,
    handleNewMessage
  );

  useEffect(() => {
    // Jika pesan error mengandung kata kunci "nonaktif" atau "disabled"
    if (socketError && (socketError.toLowerCase().includes('nonaktif') || socketError.toLowerCase().includes('disabled'))) {
      setIsChatDisabled(true);
    } else {
      // Reset jika error hilang (misal connect ulang) atau error jenis lain
      setIsChatDisabled(false);
    }
  }, [socketError]);
  
  // --- Effects ---
  useEffect(() => {
    if (socket && user && isConnected) {
      // Pastikan user.id dikonversi ke string/number yang sesuai
      const userId = user.id || (user as any).user_id; 
      socket.emit('join_user_channel', { user_id: userId });
    }
  }, [socket, user, isConnected]);

  // Request notification permission saat mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Handle Init Store ID (Redirect from Product Page)
  useEffect(() => {
    if (!user || user.role !== 'BUYER') return;
    
    const params = new URLSearchParams(location.search);
    const initStoreId = params.get('init_store_id');
    
    if (initStoreId) {
      const initChat = async () => {
        try {
          const res = await api.post('/chat/initiate', { storeId: Number(initStoreId) });
          if (res.data.success) {
            const roomData = res.data.data;
            const roomId = roomData.room_id || `chat_${roomData.store_id}_${roomData.buyer_id}`;
            
            const newRoom: ChatRoom = {
              room_id: roomId,
              store_id: Number(roomData.store_id),
              buyer_id: Number(roomData.buyer_id),
              store_name: roomData.store_name,
              buyer_name: roomData.buyer_name || user.name,
              store_image: roomData.store_logo_path,
              buyer_image: roomData.buyer_image || '',
              last_message: '',
              last_message_time: new Date().toISOString(),
              unread_count: 0
            };

            setRooms((prev) => {
              if (prev.find(r => r.room_id === roomId)) return prev;
              return [newRoom, ...prev];
            });
            setActiveRoom(newRoom);
            window.history.replaceState({}, document.title, '/chat');
          }
        } catch (err) {
          console.error("Gagal inisialisasi chat:", err);
        }
      };
      initChat();
    }
  }, [location.search, user]);

  // Fetch Rooms
  useEffect(() => {
    if (!user) return;
    const fetchRooms = async () => {
      try {
        const res = await api.get('/chat/rooms');
        if (res.data.success) {
          const roomsWithIds = res.data.data.map((room: any) => ({
            ...room,
            room_id: room.room_id || `chat_${room.store_id}_${room.buyer_id}`,
            store_image: room.store_logo_path,
            buyer_image: room.buyer_image
          }));
          
          setRooms(prev => {
             if (activeRoom && !roomsWithIds.find((r: any) => r.room_id === activeRoom.room_id)) {
                return [activeRoom, ...roomsWithIds];
             }
             return roomsWithIds;
          });
        }
      } catch (err) {
        console.error("Gagal memuat list chat:", err);
      }
    };
    fetchRooms();
  }, [user]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  // Mark messages as read when viewing active room
  useEffect(() => {
    if (activeRoom && socket && isConnected && messages.length > 0) {
      // Emit mark_as_read to server
      socket.emit('mark_as_read', {
        storeId: activeRoom.store_id,
        buyerId: activeRoom.buyer_id
      });
    }
  }, [activeRoom, messages.length, socket, isConnected]);

  // --- Handlers ---
  const handleSelectRoom = (room: ChatRoom) => {
    setActiveRoom(room);
    setRooms(prev => prev.map(r => r.room_id === room.room_id ? {...r, unread_count: 0} : r));
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !activeRoom) return;
    sendMessage(inputMessage);
    setInputMessage('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(false); 
  };

  const handleTypingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (!activeRoom) return;
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
  };

  const getOpponentInfo = (room: ChatRoom) => {
    if (!user) return { name: 'Loading...', image: '' };
    if (user.role === 'BUYER') return { name: room.store_name, image: room.store_image };
    return { name: room.buyer_name, image: room.buyer_image };
  };

  // --- RENDER ---
  if (loading) return <div className="flex h-screen items-center justify-center">Loading Chat...</div>;
  if (!user) return <div className="p-10 text-center">Silakan login terlebih dahulu.</div>;

  const filteredRooms = rooms.filter(room => 
    getOpponentInfo(room).name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ambil ID user yang aman (handle kemungkinan user_id dari PHP)
  const currentUserId = Number(user.id || (user as any).user_id);

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-80px)]">
      <Card className="flex h-full overflow-hidden shadow-xl border border-gray-200">
        
        {/* SIDEBAR */}
        <div className={`${activeRoom ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col border-r border-gray-200 bg-white`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pesan</h2>
            <div className="relative">
              <img src="/assets/icons/search.svg" alt="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <Input 
                placeholder="Cari chat..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum ada percakapan</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {user?.role === 'BUYER' 
                    ? 'Mulai chat dengan toko untuk bertanya tentang produk'
                    : 'Menunggu pembeli menghubungi Anda'}
                </p>
                {user?.role === 'BUYER' && (
                  <Button 
                    onClick={() => setShowNewChatModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                  >
                    Chat Baru
                  </Button>
                )}
              </div>
            ) : (
              filteredRooms.map((room) => {
                const { name, image } = getOpponentInfo(room);
                return (
                  <div 
                    key={room.room_id}
                    onClick={() => handleSelectRoom(room)}
                    className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      activeRoom?.room_id === room.room_id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Avatar src={image} alt={name} className="w-12 h-12 mr-4" fallback={name[0]} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">{name}</h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {formatTimeAgo(room.last_message_time)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500 truncate mr-2">
                          {room.last_message || <span className="italic text-gray-400">Belum ada pesan</span>}
                        </p>
                        {room.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className={`${activeRoom ? 'flex' : 'hidden md:flex'} w-full md:w-2/3 flex-col bg-gray-50`}>
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center">
                  <button 
                    onClick={() => setActiveRoom(null)}
                    className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded-full"
                  >
                    <img src="/assets/icons/arrow-left.svg" alt="Back" className="w-5 h-5" />
                  </button>
                  <Avatar 
                    src={getOpponentInfo(activeRoom).image} 
                    alt={getOpponentInfo(activeRoom).name}
                    fallback={getOpponentInfo(activeRoom).name[0]} 
                  />
                  <div className="ml-3">
                    <h3 className="font-bold text-gray-800">{getOpponentInfo(activeRoom).name}</h3>
                    <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-xs text-gray-500">{isConnected ? 'Online' : 'Terputus'}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <img src="/assets/icons/more-vertical.svg" alt="Options" className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" onScroll={handleScroll}>
                {isLoadingMore && (
                  <div className="flex justify-center py-2">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
                {isLoading ? (
                   <div className="space-y-4">
                     {/* Loading Skeleton */}
                     {[1, 2, 3, 4, 5].map((i) => (
                       <div key={i} className={`flex w-full ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${i % 2 === 0 ? 'bg-blue-100' : 'bg-gray-200'} animate-pulse`}>
                           <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                           <div className="h-3 bg-gray-300 rounded w-24"></div>
                         </div>
                       </div>
                     ))}
                   </div>
                ) : (
                  messages.map((msg, idx) => {
                    // Logic perbandingan ID yang lebih kuat
                    const isMe = Number(msg.sender_id) === currentUserId;
                    
                    return (
                      <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {/* Bubble Chat */}
                        <div 
                          className={`
                            relative max-w-[75%] px-4 py-2 rounded-2xl shadow-sm
                            ${isMe 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                            }
                          `}
                        >
                          
                          {msg.message_type === 'image' ? (
                            <div className="relative group">
                                <img 
                                  src={getThumbUrl(msg.content)} 
                                  onError={(e) => { e.currentTarget.src = msg.content }} 
                                  alt="Attachment" 
                                  className="rounded-lg max-w-[200px] max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setSelectedImage(msg.content)} 
                                />
                            </div>
                        ) : msg.message_type === 'item_preview' ? (
                            <div className="bg-white rounded-lg p-3 max-w-[250px] border border-gray-200">
                                {(msg as any).product_image && (
                                  <img 
                                    src={(msg as any).product_image} 
                                    alt="Product" 
                                    className="w-full h-32 object-cover rounded-md mb-2"
                                  />
                                )}
                                <h4 className="font-semibold text-gray-800 text-sm mb-1">
                                  {(msg as any).product_name || 'Product Preview'}
                                </h4>
                                {(msg as any).product_price && (
                                  <p className="text-blue-600 font-bold text-sm">
                                    Rp {Number((msg as any).product_price).toLocaleString('id-ID')}
                                  </p>
                                )}
                                {msg.product_id && (
                                  <a 
                                    href={`/product?id=${msg.product_id}`}
                                    className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                                  >
                                    Lihat Produk →
                                  </a>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {msg.content}
                            </p>
                        )}
                          
                          {/* Info Waktu & Status */}
                          <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'justify-end text-blue-200' : 'justify-start text-gray-400'}`}>
                             <span>{formatTimeAgo(msg.created_at)}</span>
                             {isMe && (
                                <span>
                                   {msg.is_read ? (
                                      <span className="text-blue-300">✓✓</span>
                                   ) : (
                                      <span className="text-blue-200">✓</span>
                                   )}
                                </span>
                             )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Typing Indicator */}
                {otherUserTyping && (
                  <div className="flex justify-start">
                     <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm">
                        <TypingIndicator />
                     </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-200">
                {!isConnected && (
                   <div className="text-xs text-red-500 mb-2 px-2">Status: Terputus ({socketError || 'Reconnecting...'})</div>
                )}

                 {/* Hidden file input for image upload */}
                 <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                 />
                
                 <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                   <Button 
                     type="button" 
                     variant="ghost" 
                     className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                     onClick={() => fileInputRef.current?.click()}
                     disabled={!isConnected || isUploading || isChatDisabled}
                   >
                     <img src="/assets/icons/image.svg" alt="Upload" className={`w-6 h-6 ${isUploading ? 'animate-pulse' : ''}`} />
                   </Button>

                   <Button 
                     type="button" 
                     variant="ghost" 
                     className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                     onClick={() => setShowProductModal(true)}
                     disabled={!isConnected || isChatDisabled}
                     title="Kirim Preview Produk"
                   >
                     <span className="text-lg">🛍️</span>
                   </Button>
                   
                   <Input 
                      className="flex-1 rounded-full py-2 px-4 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tulis pesan..."
                      value={inputMessage}
                      onChange={handleTypingInput}
                   />
                   
                   <Button 
                      type="submit" 
                      className={`rounded-full p-2 px-4 ${isConnected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}
                      disabled={!inputMessage.trim() || !isConnected || isChatDisabled}
                   >
                      <img src="/assets/icons/send.svg" alt="Send" className="w-5 h-5" />
                   </Button>
                </form>

                {/* Product Preview Modal */}
                {showProductModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                      <h3 className="text-lg font-semibold mb-4">Pilih Produk untuk Preview</h3>
                      
                      <Input 
                        placeholder="Cari produk..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          searchProductsForPreview(e.target.value);
                        }}
                        className="mb-4"
                      />

                      <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                        {isSearchingProducts ? (
                          <p className="text-sm text-gray-500 text-center py-4">Mencari produk...</p>
                        ) : searchProducts.length > 0 ? (
                          searchProducts.map((product) => (
                            <div 
                              key={product.product_id}
                              onClick={() => handleSendProductPreview(product)}
                              className="flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded-lg border border-gray-200"
                            >
                              {product.main_image_path && (
                                <img 
                                  src={product.main_image_path} 
                                  alt={product.product_name}
                                  className="w-12 h-12 object-cover rounded mr-3"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{product.product_name}</p>
                                <p className="text-xs text-blue-600 font-bold">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            {productSearch ? 'Produk tidak ditemukan' : 'Tidak ada produk tersedia'}
                          </p>
                        )}
                      </div>

                      <Button 
                        onClick={() => setShowProductModal(false)}
                        variant="secondary"
                        className="w-full"
                      >
                        Tutup
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
               <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">👋</span>
               </div>
               <h3 className="text-xl font-semibold text-gray-600">Selamat Datang di Nimonspedia Chat</h3>
               <p className="mt-2 text-gray-500">Pilih percakapan untuk mulai berkirim pesan.</p>
            </div>
          )}
          {selectedImage && (
            <div 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-95 p-4 animate-fade-in"
                onClick={() => setSelectedImage(null)}
            >
                <button 
                    className="absolute top-4 right-4 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                    onClick={() => setSelectedImage(null)}
                >
                    {/* Pastikan file x.svg sudah ada di assets */}
                    <img src="/assets/icons/x.svg" alt="Close" className="w-8 h-8 invert filter brightness-0 invert" /> 
                </button>
                <img 
                    src={selectedImage} 
                    alt="Full Preview" 
                    className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
          )}

        </div>
      </Card>

      {/* New Chat Modal */}
      {showNewChatModal && user?.role === 'BUYER' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Mulai Chat Baru</h3>
              <button 
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <Input 
              placeholder="Cari toko..."
              value={storeSearch}
              onChange={(e) => {
                setStoreSearch(e.target.value);
                fetchStores(e.target.value);
              }}
              className="mb-4"
            />

            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoadingStores ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500 mt-2">Memuat toko...</p>
                </div>
              ) : stores.length > 0 ? (
                stores.map((store) => (
                  <div 
                    key={store.store_id}
                    onClick={() => handleStartNewChat(store.store_id)}
                    className="flex items-center p-3 cursor-pointer hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  >
                    {store.store_logo_path && (
                      <img 
                        src={`/storage/${store.store_logo_path}`}
                        alt={store.store_name}
                        className="w-12 h-12 object-cover rounded-full mr-3"
                        onError={(e) => {
                          e.currentTarget.src = '/storage/store_logos/default-store.svg';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{store.store_name}</p>
                      {store.store_description && (
                        <p className="text-xs text-gray-500 truncate">
                          {store.store_description.replace(/<[^>]*>/g, '').substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    {storeSearch ? 'Toko tidak ditemukan' : 'Tidak ada toko tersedia'}
                  </p>
                </div>
              )}
            </div>

            <Button 
              onClick={() => setShowNewChatModal(false)}
              variant="secondary"
              className="w-full mt-4"
            >
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;