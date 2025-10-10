import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number;
  overview: string | null;
  created_at: string;
}

interface UseWatchlistReturn {
  watchlistItems: WatchlistItem[];
  isInWatchlist: (tmdbId: number, mediaType: 'movie' | 'tv') => boolean;
  addToWatchlist: (item: Omit<WatchlistItem, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  removeFromWatchlist: (tmdbId: number, mediaType: 'movie' | 'tv') => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useWatchlist(userId: string | null): UseWatchlistReturn {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!userId) {
      setWatchlistItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/watchlist?user_id=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch watchlist');
      
      const data = await response.json();
      setWatchlistItems(data);
      setError(null);
    } catch (err) {
      setError('Failed to load watchlist');
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Set up real-time subscription and refresh after operations
  useEffect(() => {
    if (!userId) return;

    fetchWatchlist();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('watchlist_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'watchlist',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Watchlist change detected:', payload);
          // Refresh the entire watchlist to ensure consistency
          fetchWatchlist();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, fetchWatchlist]);

  // Check if item is in watchlist
  const isInWatchlist = useCallback((tmdbId: number, mediaType: 'movie' | 'tv') => {
    return watchlistItems.some(item => 
      item.tmdb_id === tmdbId && item.media_type === mediaType
    );
  }, [watchlistItems]);

  // Add to watchlist
  const addToWatchlist = useCallback(async (item: Omit<WatchlistItem, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return false;

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...item
        }),
      });

      if (!response.ok) throw new Error('Failed to add to watchlist');
      
      // Refresh watchlist immediately for UI update
      await fetchWatchlist();
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      setError('Failed to add to watchlist');
      return false;
    }
  }, [userId, fetchWatchlist]);

  // Remove from watchlist
  const removeFromWatchlist = useCallback(async (tmdbId: number, mediaType: 'movie' | 'tv') => {
    if (!userId) return false;

    try {
      const response = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId,
          tmdb_id: tmdbId,
          media_type: mediaType
        }),
      });

      if (!response.ok) throw new Error('Failed to remove from watchlist');
      
      // Refresh watchlist immediately for UI update
      await fetchWatchlist();
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      setError('Failed to remove from watchlist');
      return false;
    }
  }, [userId, fetchWatchlist]);

  return {
    watchlistItems,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    loading,
    error
  };
}