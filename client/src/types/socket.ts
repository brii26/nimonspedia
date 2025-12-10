// Socket payload interfaces untuk client
export interface AuctionBid {
  id: number;
  auction_id: number;
  user_id: number;
  bid_amount: number;
  created_at: string;
  user_name?: string;
}

export interface AuctionData {
  id: number;
  product_id: number;
  starting_price: number;
  min_increment: number;
  start_time: string;
  end_time: string;
  winner_id?: number | null;
  current_price?: number;
  bid_count?: number;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
}

export interface AuctionRoom {
  auction: AuctionData;
  current_price: number;
  bid_count: number;
  time_remaining: number;
  recent_bids: AuctionBid[];
}

// Chat interfaces
export interface ChatMessage {
  message_id: number;
  store_id: number;
  buyer_id: number;
  sender_id: number;
  message_type: 'text' | 'image' | 'item_preview';
  content: string;
  product_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface ChatRoom {
  id: number;
  store_id: number;
  buyer_id: number;
  store_name?: string;
  buyer_name?: string;
  last_message?: ChatMessage;
  unread_count?: number;
}

// Socket event payloads
export interface JoinAuctionPayload {
  auction_id: number;
}

export interface PlaceBidPayload {
  auction_id: number;
  bid_amount: number;
}

export interface JoinChatPayload {
  store_id: number;
  buyer_id: number;
}

export interface SendMessagePayload {
  store_id: number;
  buyer_id: number;
  message: string;
}

export interface TypingPayload {
  store_id: number;
  buyer_id: number;
  is_typing: boolean;
}

// Socket response payloads
export interface BidPlacedResponse {
  bid: AuctionBid;
  current_price: number;
  bid_count: number;
}

export interface AuctionTimerResponse {
  time_remaining: number;
}

export interface AuctionListItem extends AuctionData {
  title: string;       
  image: string;       
  store_name: string;
  bid_count?: number;
  winner_name?: string | null;
}

// Payload for Requesting the List
export interface GetAuctionListPayload {
  page: number;
  limit: number;
  filter: 'active' | 'scheduled' | 'ended';
  search?: string
}

// Response for the List
export interface AuctionListResponse {
  data: AuctionListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AuctionEndedResponse {
  auction_id: number;
  winner_id: number | null;
  final_price: number;
}

export interface MessageSentResponse {
  message: ChatMessage;
}

export interface UserTypingResponse {
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

// Error responses
export interface SocketErrorResponse {
  error: string;
  code?: string;
}