import { onlineManager, QueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import type { AxiosError } from "axios";

/** HTTP 4xx errors won't fix themselves with a retry — skip the storm. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = (error as AxiosError | undefined)?.response?.status;
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep fetched data "fresh" for 5 minutes.
      // During this period, React Query returns cached data
      // and avoids unnecessary network requests.
      staleTime: 5 * 60 * 1000,

      // Retry network/5xx errors twice; 4xx (404/401/403) skip retry.
      retry: shouldRetry,
      // Cap exponential backoff so a flaky tunnel doesn't loop fast.
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),

      // Prevent automatic refetch when the app/window
      // regains focus (useful for mobile apps to reduce API calls).
      refetchOnWindowFocus: false,
    },

    mutations: {
      // Same 4xx-skip rule applies to writes (eg. validation errors).
      retry: (failureCount, error) =>
        shouldRetry(failureCount, error) && failureCount < 1,
    },
  },
});

// QueryClient
// │
// ├── queries
// │     ├── staleTime → lấy dữ liệu mới sau bao lâu
// │     ├── retry → lỗi thì thử lại mấy lần
// │     └── refetchOnWindowFocus → quay lại app có gọi API không
// │
// └── mutations
//       └── retry → thao tác ghi lỗi thì thử lại mấy lần

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  }),
);
