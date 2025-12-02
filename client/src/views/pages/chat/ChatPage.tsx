import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext.js';
import { io, Socket } from 'socket.io-client';
import api from '../../../services/api/axios.js';

// --- UI Components ---
import Card from '../../components/ui/Card.js';
import Button from '../../components/ui/Button.js';
import Input from '../../components/ui/Input.js';
import Avatar from '../../components/ui/Avatar.js';
import TypingIndicator from '../../components/ui/TypingIndicator.js';
import { Send, Search, Image as ImageIcon, MoreVertical, ArrowLeft } from 'lucide-react';

// --- Helper Function: Format Waktu (Pengganti date-fns) ---
const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return 'Baru saja';
  if (diffInSeconds < 60) return `${diffInSeconds} detik lalu`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  if (diffInSeconds < 172800) return 'Kemarin'; // < 48 jam (kasar)

  // Lebih dari kemarin, tampilkan tanggal: "3 Des 2025"
  return new Intl.DateTimeFormat('id-ID', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  }).format(date);
};

// --- Interfaces ---
interface Message {
  message_id: number;
  sender_id: number;
  message_text: string;
  created_at: string;
  is_read: boolean;
  type: 'text' | 'image' | 'item_preview';
}

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

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const ChatPage = () => {
  const { user, loading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // State Data
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // UI State
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Init Socket & Load Room List
  useEffect(() => {
    if (!user) return;

    // Load initial Rooms via REST API
    const fetchRooms = async () => {
      try {
        const res = await api.get('/chat/rooms');
        if (res.data.success) {
          setRooms(res.data.data);
        }
      } catch (err) {
        console.error("Gagal memuat daftar chat:", err);
      }
    };

    fetchRooms();

    // Connect Socket
    const newSocket = io(SOCKET_URL, {
      withCredentials: true, 
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket Connected:', newSocket.id);
      newSocket.emit('join_user_channel', { user_id: user.id });
    });

    // Listener: Pesan Baru Masuk
    newSocket.on('new_message', (payload: any) => {
      // Jika pesan untuk room yang sedang dibuka
      if (activeRoom && payload.room_id === activeRoom.room_id) {
        setMessages((prev) => [...prev, {
          message_id: Date.now(), 
          sender_id: payload.sender_id,
          message_text: payload.message,
          created_at: new Date().toISOString(),
          is_read: false,
          type: payload.type || 'text'
        }]);
        scrollToBottom();
      } 
      
      // Update List Sidebar 
      setRooms((prevRooms) => {
        const otherRooms = prevRooms.filter(r => r.room_id !== payload.room_id);
        const targetRoom = prevRooms.find(r => r.room_id === payload.room_id);
        
        if (targetRoom) {
          return [{
            ...targetRoom,
            last_message: payload.message,
            last_message_time: new Date().toISOString(),
            unread_count: (activeRoom?.room_id === payload.room_id) ? 0 : targetRoom.unread_count + 1
          }, ...otherRooms];
        }
        return prevRooms; 
      });
    });

    // Listener: Typing Indicator
    newSocket.on('typing_status', (payload: any) => {
      if (activeRoom && payload.room_id === activeRoom.room_id && payload.user_id !== user.id) {
        setIsTyping(payload.is_typing);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, activeRoom]); 

  // 2. Scroll ke bawah otomatis
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 3. Handle Select Room
  const handleSelectRoom = async (room: ChatRoom) => {
    setActiveRoom(room);
    setIsLoadingHistory(true);
    
    setRooms(prev => prev.map(r => r.room_id === room.room_id ? {...r, unread_count: 0} : r));

    try {
      const res = await api.get(`/chat/messages/${room.room_id}`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error("Gagal load history:", err);
    } finally {
      setIsLoadingHistory(false);
      scrollToBottom();
    }
  };

  // 4. Handle Send Message
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !socket || !activeRoom || !user) return;

    const payload = {
      room_id: activeRoom.room_id,
      message: inputMessage,
      type: 'text',
      sender_id: user.id 
    };

    socket.emit('send_message', payload);

    setMessages(prev => [...prev, {
      message_id: Date.now(),
      sender_id: Number(user.id),
      message_text: inputMessage,
      created_at: new Date().toISOString(),
      is_read: false,
      type: 'text'
    }]);

    setRooms(prev => {
        const other = prev.filter(r => r.room_id !== activeRoom.room_id);
        const current = prev.find(r => r.room_id === activeRoom.room_id);
        if(current) {
            return [{
                ...current,
                last_message: inputMessage,
                last_message_time: new Date().toISOString()
            }, ...other];
        }
        return prev;
    });

    setInputMessage('');
    setIsTyping(false);
  };

  // 5. Handle Typing Logic
  const handleTypingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    
    if (!socket || !activeRoom) return;

    socket.emit('typing', { room_id: activeRoom.room_id, is_typing: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { room_id: activeRoom.room_id, is_typing: false });
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

  // --- Render ---

  if (loading) return <div className="flex h-screen items-center justify-center">Loading Chat...</div>;
  if (!user) return <div className="p-10 text-center">Silakan login terlebih dahulu.</div>;

  const filteredRooms = rooms.filter(room => {
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
              filteredRooms.map(room => {
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
                          {/* MENGGUNAKAN HELPER BARU */}
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
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        <span className="text-xs text-gray-500">Online</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </Button>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {isLoadingHistory ? (
                   <div className="flex justify-center py-10"><span className="loader">Loading history...</span></div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender_id === Number(user.id);
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                          <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                             {/* MENGGUNAKAN HELPER BARU */}
                             {formatTimeAgo(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {isTyping && (
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