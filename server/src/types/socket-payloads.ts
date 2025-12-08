// SHARED TYPES & ENUMS
export type AuctionStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';
export type MessageType = 'text' | 'image' | 'item_preview';

export interface ErrorPayload {
  status: 'error';
  message: string;
}

// ==========================================
// DATA MODELS 
// ==========================================

// Base Auction 
export interface AuctionBase {
  id: number; //
  product_id: number;
  product_name: string; 
  image: string | null;
  store_name: string;
  starting_price: number;
  current_price: number;
  min_increment: number;
  start_time: string;
  end_time: string | null;
  status: AuctionStatus;
}

// Data untuk List (Grid View)
export interface AuctionListItem extends AuctionBase {
  bid_count?: number; 
}

// Data untuk Detail Room (Full View)
export interface AuctionDetail extends AuctionBase {
  description?: string;
  winner_name?: string | null;
  owner_id?: number;
}

// Model Pesan Chat
export interface ChatMessage {
  message_id: number;
  sender_id: number;
  content: string;
  message_type: MessageType;
  product_id?: number | null;
  created_at: string;
  is_read: boolean;
  product_name?: string;
  product_image?: string;
  product_price?: number;
}

// ==========================================
// CHAT SOCKET PAYLOADS
// ==========================================

// --- CLIENT REQUESTS (Client -> Server) ---

export interface JoinChatPayload {
  storeId: number;
  buyerId?: number; 
}

export interface SendMessagePayload {
  receiverId: number; 
  message: string;
  type?: MessageType; 
  productId?: number; 
}

export interface TypingPayload {
  receiverId: number;
}

export interface GetChatHistoryPayload {
  storeId: number;
  buyerId?: number;
  limit?: number;
}

// --- SERVER RESPONSES (Server -> Client) ---

export interface ChatJoinedPayload {
  room: string;
  storeId: number;
  buyerId: number;
}

export interface ChatHistoryPayload {
  storeId: number;
  buyerId: number;
  messages: ChatMessage[];
}

export interface PartnerTypingPayload {
  senderId: number;
  senderName: string;
  isTyping: boolean;
}

export interface MessageSentResponse {
  message: ChatMessage;
}

// ==========================================
// AUCTION SOCKET PAYLOADS
// ==========================================

// --- CLIENT REQUESTS (Client -> Server) ---

export interface JoinAuctionPayload {
  auctionId: number;
}

export interface PlaceBidPayload {
  auctionId: number;
  amount: number;
}

export interface GetAuctionListPayload {
  page: number;
  limit: number;
  filter: 'active' | 'scheduled';
}

// --- SERVER RESPONSES (Server -> Client) ---

export interface AuctionJoinedPayload {
  auctionId: number;
  auction: AuctionDetail;
  timeLeft: number;
}

// Response List Auction (Pagination)
export interface AuctionListResponse {
  data: AuctionListItem[];
  total: number;
  page: number;
  totalPages: number;
}

// Broadcast ada bid baru
export interface NewBidUpdatePayload {
  auctionId: number;
  bidderName: string;
  amount: number;
  timestamp: string;
}

// Broadcast timer update (per detik)
export interface TimerUpdatePayload {
  auctionId: number;
  timeLeft: number;
}

// Broadcast lelang selesai
export interface AuctionEndedPayload {
  auctionId: number;
  finalPrice: number;
  winner: string | null;
  endTime: string;
}

// Response sukses pasang bid
export interface BidPlacedPayload {
  auctionId: number;
  amount: number;
  newEndTime: number;
}

// Status snapshot
export interface AuctionStatusPayload {
  auctionId: number;
  currentPrice: number;
  highestBidder: string | null;
  timeLeft: number;
  isActive: boolean;
}