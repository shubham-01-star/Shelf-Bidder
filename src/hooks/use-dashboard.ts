import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';

export interface DashboardData {
  todayEarnings: number;
  weeklyEarnings: number;
  totalBalance: number;
  activeTasks: number;
  completedToday: number;
  pendingAuctions: number;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  error?: string;
}

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardResponse>(
    '/api/dashboard',
    apiClient.get,
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // refresh every minute
    }
  );

  return {
    data: data?.data || null,
    isLoading,
    isError: error,
    mutate,
  };
}
