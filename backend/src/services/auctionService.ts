import auctionRepository, { Auction } from '../repositories/auctionRepository.js';
import { AuctionStatus } from '../types/socket-payloads.js';

class AuctionService {
  async getAuctionById(auctionId: number): Promise<Auction | null> {
    return auctionRepository.getAuctionById(auctionId);
  }

  async getAuctionParticipants(auctionId: number) {
    return auctionRepository.getAuctionParticipants(auctionId);
  }

  async getBidHistory(auctionId: number, limit: number = 10) {
    return auctionRepository.getBidHistory(auctionId, limit);
  }

  async updateAuctionStatus(auctionId: number, newStatus: AuctionStatus): Promise<Auction | null> {
    return auctionRepository.updateAuctionStatus(auctionId, newStatus);
  }

  async extendAuction(auctionId: number, newEndTime: Date) {
    return auctionRepository.extendAuction(auctionId, newEndTime);
  }

  async endAuction(auctionId: number) {
    return auctionRepository.endAuction(auctionId);
  }

  async findScheduledToActivate(): Promise<Auction[]> {
    return auctionRepository.findScheduledToActivate();
  }

  async findAllActiveAuctions(): Promise<Auction[]> {
    return auctionRepository.findAllActiveAuctions();
  }

  async getAuctionForBiddingWithClient(client: any, auctionId: number) {
    return auctionRepository.getAuctionForBiddingWithClient(client, auctionId);
  }

  async insertBidWithClient(client: any, auctionId: number, userId: number, bidAmount: number) {
    return auctionRepository.insertBidWithClient(client, auctionId, userId, bidAmount);
  }

  async updateAuctionBidWithClient(client: any, auctionId: number, newPrice: number, winnerId: number) {
    return auctionRepository.updateAuctionBidWithClient(client, auctionId, newPrice, winnerId);
  }

  async getAuctionsPaginated(page: number, limit: number, filter: any, search: string = '') {
    return auctionRepository.getAuctionsPaginated(page, limit, filter, search);
  }

  async getActiveAuctionsForTimers() {
    return auctionRepository.getActiveAuctionsForTimers();
  }
}

export default new AuctionService();
