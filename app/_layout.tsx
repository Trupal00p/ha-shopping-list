import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { PaperProvider, useTheme } from "react-native-paper";

const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={{dark:false}}>
        <ConfiguredStack />
      </PaperProvider>
    </QueryClientProvider>
  );
}
