import { RefreshControl, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
  ActivityIndicator,
  Button,
  List,
  Text,
  useTheme,
} from "react-native-paper";
import { ShoppingItem } from "../types";
import { AddItemInput } from "./AddItemInput";
import { useMutations } from "../hooks/useMutations";
import { useRealtimeList } from "../hooks/useRealtimeList";

export function ShoppingListView() {
  const theme = useTheme();

  const {
    isLoading,
    isError,
    error,
    wsConnected,
    reconnectWs,
    todo,
    completed,
    refetch,
    isRefetching
  } = useRealtimeList();

  const { addNew, toggle, clearCompleted } = useMutations();

  const onRefresh = () => {
    refetch();
    reconnectWs();
  };

  return isLoading ? (
    <View style={{ padding: 30 }}>
      <ActivityIndicator animating={true} size="large" />
    </View>
  ) : isError ? (
    <Text>{error.message}</Text>
  ) : (
    <>
      <ScrollView
        style={{ height: "100%" }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
      >
        <List.Section>
          {todo?.map((item: ShoppingItem) => (
            <List.Item
              key={item.id}
              title={item.name}
              onPress={() => toggle.mutate(item)}
              left={(props) => (
                <List.Icon
                  {...props}
                  color={
                    item.complete
                      ? theme.colors.primary
                      : theme.colors.secondary
                  }
                  icon={
                    item.complete ? "checkbox-marked" : "checkbox-blank-outline"
                  }
                />
              )}
            />
          ))}
        </List.Section>
        <List.Section>
          <List.Subheader>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignContent: "space-between",
              }}
            >
              <Button
                icon="notification-clear-all"
                mode="elevated"
                onPress={() => clearCompleted.mutate()}
              >
                Clear Completed
              </Button>
            </View>
          </List.Subheader>
          {completed?.map((item: ShoppingItem) => (
            <List.Item
              key={item.id}
              title={item.name}
              onPress={() => toggle.mutate(item)}
              left={(props) => (
                <List.Icon
                  {...props}
                  color={
                    item.complete
                      ? theme.colors.primary
                      : theme.colors.secondary
                  }
                  icon={
                    item.complete ? "checkbox-marked" : "checkbox-blank-outline"
                  }
                />
              )}
            />
          ))}
        </List.Section>
        <View style={{ height: 200 }}></View>
      </ScrollView>
      <View
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          right: 10,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          {wsConnected ? (
            <Text>🟢 Real-Time Updates</Text>
          ) : (
            <Text>🔴 Real-Time Updates</Text>
          )}
        </View>
        <AddItemInput addMutation={addNew} />
      </View>
    </>
  );
}
