import { onlineManager, QueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep fetched data "fresh" for 5 minutes.
      // During this period, React Query returns cached data
      // and avoids unnecessary network requests.
      staleTime: 5 * 60 * 1000,

      // Retry failed requests up to 2 times before
      // exposing the error to the UI.
      retry: 2,

      // Prevent automatic refetch when the app/window
      // regains focus (useful for mobile apps to reduce API calls).
      refetchOnWindowFocus: false,
    },

    mutations: {
      // Retry failed write operations (create/update/delete)
      // once before returning an error.
      retry: 1,
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
