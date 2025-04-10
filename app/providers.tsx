"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster, toast } from 'sonner';
import { useState } from 'react';
import { API_CONFIG } from '@/lib/config';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: API_CONFIG.CACHE_DURATION,
            gcTime: API_CONFIG.CACHE_DURATION * 2,
            retry: API_CONFIG.RETRY_ATTEMPTS,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
          mutations: {
            retry: API_CONFIG.RETRY_ATTEMPTS,
            onError: (error: unknown) => {
              if (error instanceof Error) {
                toast.error(error.message);
              }
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
        <Toaster />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}




