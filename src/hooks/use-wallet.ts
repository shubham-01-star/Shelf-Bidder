import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import type { WalletTransaction } from '@/types/models';

export interface WalletResponse {
  success: boolean;
  data: {
    balance: number;
    todayEarnings: number;
    weeklyEarnings: number;
    transactions: WalletTransaction[];
  };
  error?: string;
}

export function useWallet() {
  const { data, error, isLoading, mutate } = useSWR<WalletResponse>(
    '/api/wallet',
    apiClient.get,
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // refresh every minute
    }
  );

  const requestPayout = async (amount: number) => {
    const response = await apiClient.post('/api/wallet/withdraw', { amount });
    mutate(); // Refresh balance and transaction list
    return response;
  };

  return {
    walletData: data?.data,
    isLoading,
    isError: error,
    mutate,
    requestPayout,
  };
}
