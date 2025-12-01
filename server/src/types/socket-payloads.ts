// --- SHARED PAYLOADS ---

// Payload error standar untuk dikirim ke client
export interface ErrorPayload {
  status: 'error';
  message: string;
}

// --- CHAT PAYLOADS ---

// Client -> Server: Kirim pesan
export interface SendMessagePayload {
  receiverId: number;
  message: string;
}

// Client -> Server: Notifikasi sedang mengetik
export interface TypingPayload {
  receiverId: number;
}

// Server -> Client: Struktur pesan chat lengkap
export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
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