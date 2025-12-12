import { useEffect, useState } from 'react';
import socketClient from '../../../services/socketClient.js'; 
import AuctionCard from '../../components/auction/AuctionCard.js'; 
import type { AuctionListItem } from '../../../types/socket.js'; 

// UI Components
import Button from '../../components/ui/Button.js';
import Spinner from '../../components/ui/Spinner.js';
import EmptyState from '../../components/ui/EmptyState.js';
import Pagination from '../../components/ui/Pagination.js';
import SearchInput from '../../components/ui/SearchInput.js';

// Server Timer Resopnse type
interface TimerData {
  timeLeft: number;
  displayTimeLeft: number;
}

const AuctionList = () => {
  const [auctions, setAuctions] = useState<AuctionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [filter, setFilter] = useState<'active' | 'scheduled' | 'ended'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Server-synced timers
  const [serverTimers, setServerTimers] = useState<Record<number, TimerData>>({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter]);

  const fetchAuctions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        filter: filter,
        search: debouncedSearch
      });
      
      const response = await fetch(`/api/node/auctions/list?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch auctions');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAuctions(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
        if (filter === 'active') {
          fetchTimers();
        }
      } else {
        throw new Error(data.message || 'Failed to fetch auctions');
      }
    } catch (err: any) {
      console.error('Failed to fetch auctions:', err);
      setError(err.message || 'Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch current timers from server
  const fetchTimers = async () => {
    try {
      const response = await fetch('/api/node/auctions/timers', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.timers) {
        setServerTimers(data.timers);
      }
    } catch (error) {
      console.error('Failed to fetch timers:', error);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, [page, filter, debouncedSearch]);

  useEffect(() => {
    const handleStatusUpdate = () => {
      fetchAuctions();
    };

    socketClient.on('auction_status_updated', handleStatusUpdate);
    
    return () => {
      socketClient.off('auction_status_updated', handleStatusUpdate);
    };
  }, [page, filter, debouncedSearch]);

  const handleFilterChange = (newFilter: 'active' | 'scheduled' | 'ended') => {
    setFilter(newFilter);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // --- RENDERING STATUS ---
  const renderContent = () => {
    // Error State
    if (error) {
      return (
        <EmptyState 
          title="Failed to Load"
          description={error}
          className="bg-red-50 border border-red-100 rounded-lg"
          action={
            <Button onClick={() => fetchAuctions()} variant="danger" size="sm">
              Try Again
            </Button>
          }
        />
      );
    }

    // Loading State
    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center h-64">
          <Spinner size="lg" variant="primary" />
          <p className="mt-4 text-gray-500 font-medium">Loading Auctions...</p>
        </div>
      );
    }
    
    // Empty Data State
    if (auctions.length === 0) {
        const emptyMessage = searchQuery 
          ? `No ${filter} auctions found matching "${searchQuery}"`
          : `There are currently no ${filter} auctions available.`;
        
        return (
            <EmptyState 
              title="No Auctions Found"
              description={emptyMessage}
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
              winnerName={auction.winner_name}
              serverDisplayTime={serverTimers[auction.id]?.displayTimeLeft}
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
              Upcoming
            </Button>
            <Button
              variant={filter === 'ended' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('ended')}
              className={filter === 'ended' ? 'shadow-sm' : ''}
            >
              Ended
            </Button>
          </div>
        </div>
        
        <SearchInput
          placeholder="Search by product name or store..."
          onSearch={handleSearch}
          debounce={0}
          className="w-full md:max-w-md"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      </div>
      
      {renderContent()}
    </div>
  );
};

export default AuctionList;