import { io, Socket } from 'socket.io-client';
import { getToken, isTokenValid } from './auth.js';

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private heartbeatInterval: number | null = null;
  private lastPongTime: number = Date.now();

  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    const rawToken = getToken();
    const validToken = (rawToken && isTokenValid(rawToken)) ? rawToken : null;

    this.isConnecting = true;

    const socketUrl = '/';

    this.socket = io(socketUrl, {
      auth: {
        token: validToken
      },

      withCredentials: true, 
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000
    });

    this.setupEventListeners();
    this.isConnecting = false;
    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.lastPongTime = Date.now();
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnecting = false;
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      this.isConnecting = false;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('auth_error', (error) => {
      console.error('Socket auth error:', error);
    });

    this.socket.on('pong', () => {
      this.lastPongTime = Date.now();
    });
  }

  // Start heartbeat ping interval
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing interval
    
    // Ping server every 30 seconds
    this.heartbeatInterval = window.setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping');
        
        // Check if last pong was too long ago (60 seconds = missed 2 pings)
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        if (timeSinceLastPong > 60000) {
          console.warn('Heartbeat timeout - no pong received in 60s, reconnecting...');
          this.socket.disconnect();
          this.socket.connect();
        }
      }
    }, 30000);
    
    console.log('Heartbeat started');
  }

  // Stop heartbeat interval
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('Heartbeat stopped');
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Helper method untuk emit dengan error handling
  emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
		console.log("sending " + event + data);
      	this.socket.emit(event, data);
    } else {
      	console.warn('Socket not connected. Cannot emit event:', event);
    }
  }

  // Helper method untuk listen dengan type safety
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Method untuk update token saat refresh
  updateToken(newToken: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.auth = { token: newToken };
      // Reconnect dengan token baru
      this.socket.disconnect().connect();
    }
  }

  // Method untuk cek status koneksi dengan detail
  getConnectionStatus(): {
    connected: boolean;
    connecting: boolean;
    socketId?: string;
    reconnectAttempts: number;
  } {
    const socketId = this.socket?.id;
    return {
      connected: this.socket?.connected || false,
      connecting: this.isConnecting,
      ...(socketId && { socketId }),
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Export singleton instance
export const socketClient = new SocketClient();
export default socketClient;