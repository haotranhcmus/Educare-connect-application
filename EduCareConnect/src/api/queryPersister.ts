import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// Single key under which the entire React Query cache is serialised.
// Namespaced to make it easy to find / inspect / clear.
const PERSIST_KEY = "EDUCARE_CONNECT_RQ_CACHE";

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSIST_KEY,
  // Throttle writes so we don't hammer AsyncStorage on every query update.
  throttleTime: 1000,
});

/** Wipe persisted cache. Call on logout. */
export async function clearPersistedCache(): Promise<void> {
  await AsyncStorage.removeItem(PERSIST_KEY);
}
