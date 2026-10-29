// import "expo-dev-client";
import {
  QueryClient,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import { Stack } from "expo-router";
import { PaperProvider, useTheme } from "react-native-paper";
import { SettingsProvider } from "../components/SettingContext";
import { SnackProvider } from "../components/SnackContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  registerTodoChangeDefaults,
  resumeQueuedChanges,
} from "../lib/todoChanges";

// Keep the saved list around for a long time; it is all there is in a store
// with no signal
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

// Treat "connected to a network with no internet" (captive wifi, one bar of
// signal) as offline
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected && state.isInternetReachable !== false);
  })
);

// React Native has no window focus events; use app foreground/background
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener("change", (status) => {
    handleFocus(status === "active");
  });
  return () => subscription.remove();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: CACHE_MAX_AGE,
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Try once even when the device reports offline (Home Assistant may be
      // on the local network), then wait for connectivity before retrying
      networkMode: "offlineFirst",
      retry: 2,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      networkMode: "offlineFirst", // Queue when offline
    },
  },
});

// Must run before the persisted cache is restored
registerTodoChangeDefaults(queryClient);

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "shopping-list-cache",
  throttleTime: 1000,
});

const persistOptions = {
  persister,
  maxAge: CACHE_MAX_AGE,
  // Bumped when the persisted shape changes; v2 queues changes as mutations
  buster: "v2",
  dehydrateOptions: {
    // Keep the last good list even if the latest refetch failed
    shouldDehydrateQuery: (query: { state: { data: unknown } }) =>
      query.state.data !== undefined,
    // Keep every unsynced change, including ones mid-retry
    shouldDehydrateMutation: (mutation: { state: { status: string } }) =>
      mutation.state.status === "pending",
  },
};

const ConfiguredStack = () => {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    />
  );
};

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
        onSuccess={() => resumeQueuedChanges(queryClient)}
      >
        <PaperProvider theme={{ dark: false }}>
          <SettingsProvider>
            <SnackProvider>
              <ConfiguredStack />
            </SnackProvider>
          </SettingsProvider>
        </PaperProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
