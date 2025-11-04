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
      <ErrorBoundary fallback={<Text>Something went wrong</Text>}>
        <ShoppingListView
          onClearCompletedChange={(fn) => setClearCompletedFn(() => fn)}
          onHasCompletedItemsChange={setHasCompletedItems}
        />
      </ErrorBoundary>
    </View>
  );
}
AppRegistry.registerComponent("Home Assistant Shopping List", () => Wrapper);
