// --- SHARED PAYLOADS ---

// Payload error standar untuk dikirim ke client
export interface ErrorPayload {
  status: 'error';
  message: string;
}

// --- CHAT PAYLOADS ---

// Client -> Server: Kirim pesan
export interface SendMessagePayload {
  receiverId: number; // Bisa storeId (jika user=buyer) atau buyerId (jika user=seller)
  message: string;
  type?: 'text' | 'image' | 'item_preview'; 
  productId?: number; // Wajib diisi jika type = 'item_preview'
}


// Client -> Server: Notifikasi sedang mengetik
export interface TypingPayload {
  receiverId: number; // Store ID (for buyer) or Buyer ID (for seller)
}

// Client -> Server: Join chat room
export interface JoinChatPayload {
  storeId: number;
  buyerId?: number; // Required for seller, auto-filled for buyer
}

// Client -> Server: Get chat history
export interface GetChatHistoryPayload {
  storeId: number;
  buyerId?: number;
  limit?: number;
}

// Server -> Client: Struktur pesan chat lengkap (sesuai database)
export interface ChatMessage {
  message_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'item_preview';
  product_id?: number | null;
  created_at: string;
  is_read: boolean;

  // field tambahan untuk preview product (optional, join dari DB)
  product_name?: string;
  product_image?: string;
  product_price?: number;
}

// Server -> Client: Chat room joined
export interface ChatJoinedPayload {
  storeId: number;
  buyerId: number;
  room: string;
}

// Server -> Client: Chat history response
export interface ChatHistoryPayload {
  storeId: number;
  buyerId: number;
  messages: ChatMessage[];
}

// Server -> Client: Typing indicator
export interface PartnerTypingPayload {
  senderId: number;
  senderName: string;
  isTyping: boolean;
}

// --- AUCTION PAYLOADS ---

// Client -> Server: User join room lelang tertentu
export interface JoinAuctionPayload {
  auctionId: number;
}

// Client -> Server: User menawar harga
export interface PlaceBidPayload {
  auctionId: number;
  amount: number;
}

// Server -> Client: Broadcast ada bid baru (untuk update UI real-time)
export interface NewBidUpdatePayload {
  auctionId: number;
  bidderName: string;
  amount: number;
  timestamp: string; // ISO String
}

// Server -> Client: Update timer mundur (dikirim tiap detik)
export interface TimerUpdatePayload {
  auctionId: number;
  timeLeft: number; // Detik tersisa
}

// Server -> Client: Auction ended notification
export interface AuctionEndedPayload {
  auctionId: number;
  finalPrice: number;
  winner: string | null;
  endTime: string;
}

// Server -> Client: Auction status response
export interface AuctionStatusPayload {
  auctionId: number;
  currentPrice: number;
  highestBidder: string | null;
  timeLeft: number;
  isActive: boolean;
}

// Server -> Client: Auction joined successfully
export interface AuctionJoinedPayload {
  auctionId: number;
  auction: any; // Auction object
  timeLeft: number;
}

// Server -> Client: Bid placed successfully
export interface BidPlacedPayload {
  auctionId: number;
  amount: number;
  newEndTime: number;
}