import { useEffect, useState } from 'react';
import socketClient from '../../../services/socketClient.js'; 
import AuctionCard from '../../components/auction/AuctionCard.js'; 
import type { AuctionListItem, GetAuctionListPayload, AuctionListResponse } from '../../../types/socket.js'; 

// UI Components
import Button from '../../components/ui/Button.js';
import Spinner from '../../components/ui/Spinner.js';
import EmptyState from '../../components/ui/EmptyState.js';
import Pagination from '../../components/ui/Pagination.js';

const AuctionList = () => {
  const [auctions, setAuctions] = useState<AuctionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [filter, setFilter] = useState<'active' | 'scheduled'>('active');

  const fetchAuctions = (pageNumber: number, statusFilter: 'active' | 'scheduled') => {
    if (connectionStatus === 'connected') { 
      setLoading(true);
    }
    const payload: GetAuctionListPayload = { 
      page: pageNumber, 
      limit: 8, 
      filter: statusFilter 
    };
    socketClient.emit('get_auction_list', payload); 
  };

  useEffect(() => {
    if (!socketClient.isConnected()) {
        try {
            socketClient.connect();
        } catch (error) {
            console.error("Failed to initiate socket connection:", error);
            setConnectionStatus('error');
            return;
        }
    }

    const handleConnect = () => {
      setConnectionStatus('connected');
      fetchAuctions(page, filter); 
    };

    const handleConnectError = (err: Error) => {
        console.error("Socket connection error:", err.message);
        setConnectionStatus('error');
    };
    
    const handleResponse = (response: AuctionListResponse) => {
      setAuctions(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total); // Capture total items for pagination
      setLoading(false);
    };

    socketClient.on('connect', handleConnect);
    socketClient.on('reconnect', handleConnect);
    socketClient.on('connect_error', handleConnectError);
    socketClient.on('auction_list_response', handleResponse);
    
    if (socketClient.isConnected()) {
        handleConnect();
    }

    return () => {
      socketClient.off('connect', handleConnect);
      socketClient.off('reconnect', handleConnect);
      socketClient.off('connect_error', handleConnectError);
      socketClient.off('auction_list_response', handleResponse);
    };
  }, [page, filter]); 

  const handleFilterChange = (newFilter: 'active' | 'scheduled') => {
    setFilter(newFilter);
    setPage(1); 
  };

  // --- RENDERING STATUS ---
  const renderContent = () => {
    // 1. Error State
    if (connectionStatus === 'error') {
      return (
        <EmptyState 
          title="Connection Failed"
          description="Could not connect to the auction server. Please check your internet connection or try again later."
          className="bg-red-50 border border-red-100 rounded-lg"
          action={
            <Button onClick={() => window.location.reload()} variant="danger" size="sm">
              Reload Page
            </Button>
          }
        />
      );
    }

    // Loading State
    if (loading || connectionStatus === 'connecting') {
      return (
        <div className="flex flex-col justify-center items-center h-64">
          <Spinner size="lg" variant="primary" />
          <p className="mt-4 text-gray-500 font-medium">Loading Auctions...</p>
        </div>
      );
    }
    
    // Empty Data State
    if (auctions.length === 0) {
        return (
            <EmptyState 
              title="No Auctions Found"
              description={`There are currently no ${filter} auctions available.`}
              className="bg-gray-50 border border-dashed border-gray-300 rounded-lg"
            />
        );
    }
    
    // Success State (Grid + Pagination)
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[400px]">
          {auctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              id={auction.id}
              title={auction.title}
              image={auction.image}
              price={Number(auction.current_price || auction.starting_price)}
              status={auction.status}
              startTime={auction.start_time}
              endsAt={auction.end_time}
              bidCount={auction.bid_count ?? 0}
            />
          ))}
        </div>

        <div className="mt-8">
          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={(newPage) => setPage(newPage)}
            showInfo
          />
        </div>
      </>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Auctions</h1>
          <p className="text-gray-500 text-sm mt-1">Discover and bid on exclusive items</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <Button
            variant={filter === 'active' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange('active')}
            className={filter === 'active' ? 'shadow-sm' : ''}
          >
            Active Now
          </Button>
          <Button
            variant={filter === 'scheduled' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange('scheduled')}
            className={filter === 'scheduled' ? 'shadow-sm' : ''}
          >
            Coming Soon
          </Button>
        </div>
      </div>
      
      {/* Main Content Area */}
      {renderContent()}
    </div>
  );
};

export default AuctionList;