import { Stack } from "expo-router";
import { ErrorBoundary } from "react-error-boundary";
import { AppRegistry, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { ShoppingListView } from "../components/ShoppingList";
import { ListPicker } from "../components/ListPicker";
import { HeaderMenu } from "../components/HeaderMenu";
import { useState, useCallback } from "react";

export default function Wrapper() {
  const theme = useTheme();
  const [clearCompletedFn, setClearCompletedFn] = useState<(() => void) | null>(null);
  const [hasCompletedItems, setHasCompletedItems] = useState(false);

  const handleClearCompleted = useCallback(() => {
    if (clearCompletedFn) {
      clearCompletedFn();
    }
  }, [clearCompletedFn]);

  // Memoize callbacks to prevent infinite re-renders
  const handleClearCompletedChange = useCallback((fn: () => void) => {
    setClearCompletedFn(() => fn);
  }, []);

  const handleHasCompletedItemsChange = useCallback((hasItems: boolean) => {
    setHasCompletedItems(hasItems);
  }, []);

  return (
    <View style={{ backgroundColor: theme.colors.background, height: "100%" }}>
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
          onClearCompletedChange={handleClearCompletedChange}
          onHasCompletedItemsChange={handleHasCompletedItemsChange}
        />
      </ErrorBoundary>
    </View>
  );
}
AppRegistry.registerComponent("Home Assistant Shopping List", () => Wrapper);
