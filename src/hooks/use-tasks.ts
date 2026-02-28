import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import type { Task } from '@/types/models';

export interface TasksResponse {
  success: boolean;
  data: {
    tasks: Task[];
  };
  error?: string;
}

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<TasksResponse>(
    '/api/tasks',
    apiClient.get,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // refresh every 30 seconds to catch timeouts
    }
  );

  const startTask = async (taskId: string) => {
    await apiClient.post(`/api/tasks/${taskId}/start`);
    // Optimistically update or trigger re-fetch
    mutate();
  };

  return {
    tasks: data?.data?.tasks || [],
    isLoading,
    isError: error,
    mutate,
    startTask,
  };
}
