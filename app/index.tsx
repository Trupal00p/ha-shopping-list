import { Stack } from "expo-router";
import { ErrorBoundary } from "react-error-boundary";
import { AppRegistry, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { ShoppingListView } from "../components/ShoppingList";
import { ListPicker } from "../components/ListPicker";
import { HeaderMenu } from "../components/HeaderMenu";
import { KeyboardAvoidingScreen } from "../components/KeyboardAvoidingScreen";
import { useCallback } from "react";
import { useSettings } from "../components/SettingContext";
import { useTodoItems } from "../hooks/useTodoItems";
import { useTodoMutations } from "../hooks/useTodoMutations";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export default function Wrapper() {
  const theme = useTheme();
  const { settings } = useSettings();

  // Fetch data and mutations at the top level
  const todoQuery = useTodoItems(settings.selectedList);
  const mutations = useTodoMutations(settings.selectedList);
  const { isOnline } = useNetworkStatus();

  // Derive state from data
  const hasCompletedItems = todoQuery.completed.length > 0;

  // Clear completed handler
  const handleClearCompleted = useCallback(() => {
    mutations.clearCompleted(todoQuery.completed);
  }, [todoQuery.completed, mutations.clearCompleted]);

  return (
    <KeyboardAvoidingScreen style={{ backgroundColor: theme.colors.background }}>
      <Stack.Screen
        options={{
          headerTitle: () => <ListPicker />,
          headerRight: () => (
            <HeaderMenu
              onClearCompleted={handleClearCompleted}
              hasCompletedItems={hasCompletedItems}
            />
          ),
        }}
      />
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <View style={{ padding: 20 }}>
            <Text style={{ color: 'red', marginBottom: 10, fontSize: 16, fontWeight: 'bold' }}>
              Something went wrong
            </Text>
            <Text style={{ marginBottom: 10 }}>
              {error?.message || 'Unknown error'}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 20 }}>
              {error?.stack}
            </Text>
            <Text
              style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}
              onPress={resetErrorBoundary}
            >
              Try again
            </Text>
          </View>
        )}
      >
        <ShoppingListView
          todoQuery={todoQuery}
          mutations={mutations}
          isOnline={isOnline}
        />
      </ErrorBoundary>
    </KeyboardAvoidingScreen>
  );
}
AppRegistry.registerComponent("Home Assistant Shopping List", () => Wrapper);
