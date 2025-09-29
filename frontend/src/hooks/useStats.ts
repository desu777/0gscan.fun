import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService, Stats } from '../services/api';

export const useStats = (enableWebSocket = true) => {
  const [liveStats, setLiveStats] = useState<Stats | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiService.getStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (!enableWebSocket) return;

    const socket = apiService.connectWebSocket(
      (stats) => {
        setLiveStats(stats);
      },
      undefined
    );

    return () => {
      if (socket) {
        socket.off('stats-update');
      }
    };
  }, [enableWebSocket]);

  return {
    stats: liveStats || data,
    loading: isLoading,
    error,
    refetch,
  };
};

export const useScannerStatus = () => {
  return useQuery({
    queryKey: ['scanner-status'],
    queryFn: () => apiService.getScannerStatus(),
    refetchInterval: 10000, // Check every 10 seconds
  });
};