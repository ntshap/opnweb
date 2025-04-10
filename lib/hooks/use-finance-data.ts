import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_CONFIG } from '@/lib/config';

export interface FinanceSummary {
  total_income: string;
  total_expense: string;
  current_balance: string;
}

export function useFinanceData() {
  return useQuery<FinanceSummary>({
    queryKey: ['finance-summary'],
    queryFn: async (): Promise<FinanceSummary> => {
      console.log('Fetching finance summary from:', `${API_CONFIG.BASE_URL}/finance/summary`);

      try {
        // Fetch the finance summary from the backend
        const response = await apiClient.get<any>('/finance/summary');
        console.log('Finance summary response:', response);

        // Based on the API documentation, the response might be a string or an object
        // If it's a string, parse it as JSON
        let data = response;
        if (typeof response === 'string') {
          try {
            data = JSON.parse(response);
          } catch (e) {
            console.error('Failed to parse finance summary response:', e);
          }
        }

        // Extract the finance summary data
        const totalIncome = data.total_income || "0";
        const totalExpense = data.total_expense || "0";

        // Calculate the current balance if it's not provided or is incorrect
        let currentBalance = data.current_balance;

        // If current_balance is missing, 0, or doesn't match income - expense, calculate it
        if (!currentBalance || currentBalance === "0" ||
            Number(currentBalance) !== (Number(totalIncome) - Number(totalExpense))) {
          currentBalance = String(Number(totalIncome) - Number(totalExpense));
          console.log('Calculated current balance:', currentBalance);
        }

        return {
          total_income: totalIncome,
          total_expense: totalExpense,
          current_balance: currentBalance
        };
      } catch (error) {
        console.error('Error fetching finance summary:', error);
        // Try to get data from the finance history instead
        try {
          const historyResponse = await apiClient.get<any>('/finance/history');
          console.log('Fallback to finance history:', historyResponse);

          if (historyResponse && historyResponse.transactions) {
            // Calculate totals from transactions
            let totalIncome = 0;
            let totalExpense = 0;

            historyResponse.transactions.forEach((transaction: any) => {
              if (transaction.category === 'Pemasukan') {
                totalIncome += Number(transaction.amount);
              } else if (transaction.category === 'Pengeluaran') {
                totalExpense += Number(transaction.amount);
              }
            });

            const currentBalance = totalIncome - totalExpense;

            console.log('Calculated from transactions:', {
              totalIncome, totalExpense, currentBalance
            });

            return {
              total_income: String(totalIncome),
              total_expense: String(totalExpense),
              current_balance: String(currentBalance)
            };
          }
        } catch (historyError) {
          console.error('Error fetching finance history as fallback:', historyError);
        }

        // Return default values if all else fails
        return {
          total_income: "0",
          total_expense: "0",
          current_balance: "0"
        };
      }
    },
    staleTime: 30000,
    retryDelay: (attemptIndex) => Math.min(
      1000 * Math.pow(2, attemptIndex),
      30000
    )
  });
}
