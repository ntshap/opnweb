import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_CONFIG } from '@/lib/config';

// This interface matches the transaction object in the API response
export interface FinanceTransaction {
  id: number;
  amount: string;
  category: string;
  date: string;
  description: string;
  balance_before: string;
  balance_after: string;
  document_url: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// This interface matches the API response from /api/v1/finance/history
export interface FinanceHistoryResponse {
  transactions: FinanceTransaction[];
  current_balance: string;
}

export interface FinanceData {
  amount: number;
  category: "Pemasukan" | "Pengeluaran";
  date: string;
  description: string;
}

interface UpdateFinanceParams {
  id: number;
  data: FinanceData;
}

export function useFinanceHistory() {
  return useQuery<FinanceHistoryResponse>({
    queryKey: ['finance-history'],
    queryFn: async () => {
      console.log('Fetching finance history from:', `${API_CONFIG.BASE_URL}/finance/history`);
      const response = await apiClient.get<FinanceHistoryResponse>('/finance/history');
      console.log('Finance history response:', response);
      return response;
    },
    staleTime: 30000,
    retryDelay: (attemptIndex: number) => Math.min(
      1000 * Math.pow(2, attemptIndex),
      30000
    )
  });
}

export function useFinanceMutations() {
  const createFinance = useMutation<unknown, Error, FinanceData>({
    mutationFn: (data: FinanceData) => {
      console.log('Creating finance record:', data);
      return apiClient.post('/finance/', data);
    }
  });

  const updateFinance = useMutation<unknown, Error, UpdateFinanceParams>({
    mutationFn: ({ id, data }: UpdateFinanceParams) => {
      console.log(`Updating finance record ${id}:`, data);
      return apiClient.put(`/finance/${id}`, data);
    }
  });

  const deleteFinance = useMutation<unknown, Error, number>({
    mutationFn: (id: number) => {
      console.log(`Deleting finance record ${id}`);
      return apiClient.delete(`/finance/${id}`);
    }
  });

  return {
    createFinance,
    updateFinance,
    deleteFinance
  };
}




