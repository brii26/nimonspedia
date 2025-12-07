import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import api from '../../../services/api/axios.js';
import { useChatSocket } from '../../../hooks/useChatSocket.js'; 

// --- UI Components ---
import Card from '../../components/ui/Card.js';
import Button from '../../components/ui/Button.js';
import Input from '../../components/ui/Input.js';
import Avatar from '../../components/ui/Avatar.js';
import TypingIndicator from '../../components/ui/TypingIndicator.js';
import { Send, Search, Image as ImageIcon, MoreVertical, ArrowLeft } from 'lucide-react';

// --- Helper Function: Format Waktu ---
const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return 'Baru saja';
  if (diffInSeconds < 60) return `${diffInSeconds} detik lalu`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  if (diffInSeconds < 172800) return 'Kemarin';

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
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 1. SETUP HOOK & CALLBACKS ---

  // Callback: Update list sidebar ketika ada pesan baru dari Hook
  const handleNewMessage = useCallback((msg: any) => {
    setRooms((prevRooms: ChatRoom[]) => {
      // Konstruksi Room ID (Server logic: chat_{store}_{buyer})
      const targetRoomId = `chat_${msg.store_id}_${msg.buyer_id}`;
      
      const targetRoom = prevRooms.find((r: ChatRoom) => r.room_id === targetRoomId);
      const otherRooms = prevRooms.filter((r: ChatRoom) => r.room_id !== targetRoomId);
      
      if (targetRoom) {
        // Pindahkan room ke paling atas, update last message & count
        return [{
          ...targetRoom,
          last_message: msg.content,
          last_message_time: msg.created_at,
          unread_count: (activeRoom?.room_id === targetRoomId) ? 0 : targetRoom.unread_count + 1
        }, ...otherRooms];
      }
      return prevRooms; // Jika room belum ada di list (kasus chat baru), logic fetch reload bisa ditambahkan
    });
  }, [activeRoom]);

  // Init Hook
  // Kita pass ID dari activeRoom. Jika null, hook tetap connect tapi tidak join room spesifik.
  const { 
    messages, 
    sendMessage, 
    sendTyping,
    otherUserTyping,
    isLoading, // Menggantikan isLoadingHistory
    socket,
    isConnected
  } = useChatSocket(
    activeRoom ? activeRoom.store_id : null, 
    activeRoom ? activeRoom.buyer_id : null,
    handleNewMessage
  );

  // --- 2. GLOBAL EVENT LISTENER ---
  // Agar user menerima notifikasi/update sidebar walaupun sedang tidak membuka room tersebut
  useEffect(() => {
    if (socket && user && isConnected) {
      socket.emit('join_user_channel', { user_id: user.id });
    }
  }, [socket, user, isConnected]);

  // --- 2.5 HANDLE INIT_STORE_ID PARAMETER ---
  useEffect(() => {
    if (!user) return; // Wait for user to load
    
    const params = new URLSearchParams(location.search);
    const initStoreId = params.get('init_store_id');
    
    if (initStoreId && user.role === 'BUYER') {
      console.log("[ChatPage] Init store ID detected:", initStoreId);
      
      // Call initiate endpoint to create/get room
      (async () => {
        try {
          console.log("[ChatPage] Calling /chat/initiate with storeId:", initStoreId);
          const res = await api.post('/chat/initiate', { storeId: Number(initStoreId) });
          console.log("[ChatPage] Initiate response:", res.data);
          
          if (res.data.success) {
            const roomData = res.data.data;
            const roomId = roomData.room_id || `chat_${roomData.store_id}_${roomData.buyer_id}`;
            
            console.log("[ChatPage] Setting auto-select for room:", roomId);
            // Set auto-select flag and room ID
            setAutoSelectRoomId(roomId);
            setShouldAutoSelect(true);
            
            // Clean up URL
            window.history.replaceState({}, document.title, '/chat');
          }
        } catch (err) {
          console.error("[ChatPage] Gagal inisialisasi chat:", err);
        }
      })();
    }
  }, [location.search, user]);

  // --- 3. FETCH ROOM LIST (REST API) ---
  useEffect(() => {
    if (!user) return;
    const fetchRooms = async () => {
      try {
        console.log("[ChatPage] Fetching rooms for user:", user.id);
        const res = await api.get('/chat/rooms');
        console.log("[ChatPage] Rooms response:", res.data);
        
        if (res.data.success) {
          // Generate room_id for each room in format: chat_{store_id}_{buyer_id}
          const roomsWithIds = res.data.data.map((room: any) => ({
            ...room,
            room_id: room.room_id || `chat_${room.store_id}_${room.buyer_id}`
          }));
          console.log("[ChatPage] Rooms with IDs:", roomsWithIds);
          setRooms(roomsWithIds);
          
          // Auto-select room if needed
          if (shouldAutoSelect && autoSelectRoomId) {
            console.log("[ChatPage] Looking for room:", autoSelectRoomId);
            const targetRoom = roomsWithIds.find((r: any) => r.room_id === autoSelectRoomId);
            console.log("[ChatPage] Found room:", targetRoom);
            
            if (targetRoom) {
              console.log("[ChatPage] Auto-selecting room");
              handleSelectRoom(targetRoom);
              setShouldAutoSelect(false); // Reset flag
            } else {
              console.warn("[ChatPage] Target room not found in list");
            }
          }
        }
      } catch (err) {
        console.error("[ChatPage] Gagal memuat daftar chat:", err);
      }
    };
    fetchRooms();
  }, [user, shouldAutoSelect, autoSelectRoomId]);

  // --- 4. SCROLL TO BOTTOM ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  // --- 5. HANDLERS ---

  const handleSelectRoom = (room: ChatRoom) => {
    setActiveRoom(room);
    // Reset unread count lokal
    setRooms((prev: ChatRoom[]) => prev.map((r: ChatRoom) => r.room_id === room.room_id ? {...r, unread_count: 0} : r));
    // Note: Fetch messages history ditangani otomatis oleh hook via useEffect([storeId, buyerId])
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !activeRoom) return;

    // Panggil method hook (Hook sudah pegang storeId & buyerId)
    sendMessage(inputMessage);
    
    // Update UI input langsung
    setInputMessage('');
    
    // Stop typing status immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(false); 
  };

  const handleTypingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputMessage(val);
    
    if (!activeRoom) return;

    // Trigger typing event via hook
    sendTyping(true);

    // Debounce stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  // Helper: Determine display name/image based on role
  const getOpponentInfo = (room: ChatRoom) => {
    if (!user) return { name: 'Loading...', image: '' };
    if (user.role === 'BUYER') {
      return { name: room.store_name, image: room.store_image };
    }
    return { name: room.buyer_name, image: room.buyer_image };
  };

  // --- RENDER ---

  if (loading) return <div className="flex h-screen items-center justify-center">Loading Chat...</div>;
  if (!user) return <div className="p-10 text-center">Silakan login terlebih dahulu.</div>;

  const filteredRooms = rooms.filter((room: ChatRoom) => {
    const info = getOpponentInfo(room);
    return info.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-80px)]">
      <Card className="flex h-full overflow-hidden shadow-xl border border-gray-200">
        
        {/* --- SIDEBAR (List Room) --- */}
        <div className={`${activeRoom ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col border-r border-gray-200 bg-white`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pesan</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
              <div className="p-8 text-center text-gray-500">Tidak ada pesan</div>
            ) : (
              filteredRooms.map((room: ChatRoom) => {
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
                          {/* Tampilkan 'Typing...' jika sedang ngetik di room ini di sidebar (optional) */}
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

        {/* --- MAIN CHAT AREA --- */}
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
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
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
                        <span className="text-xs text-gray-500">{isConnected ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </Button>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {isLoading ? (
                   <div className="flex justify-center py-10"><span className="loader">Loading chat...</span></div>
                ) : (
                  messages.map((msg, idx) => {
                    // Hook menormalisasi sender_id. User ID harus number agar match.
                    const isMe = Number(msg.sender_id) === Number(user.id);
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                             {formatTimeAgo(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Typing Indicator dari Hook */}
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
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                   <Button type="button" variant="ghost" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                      <ImageIcon className="w-6 h-6" />
                   </Button>
                   
                   <Input 
                      className="flex-1 rounded-full py-2 px-4 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tulis pesan..."
                      value={inputMessage}
                      onChange={handleTypingInput}
                   />
                   
                   <Button 
                      type="submit" 
                      className="rounded-full bg-blue-600 hover:bg-blue-700 text-white p-2 px-4"
                      disabled={!inputMessage.trim()}
                   >
                      <Send className="w-5 h-5" />
                   </Button>
                </form>
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
        </div>
      </Card>
    </div>
  );
};

export default ChatPage;