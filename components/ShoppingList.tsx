import { RefreshControl, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
  ActivityIndicator,
  List,
  Text,
  useTheme,
} from "react-native-paper";
import { TodoItem } from "../types";
import { AddItemInput } from "./AddItemInput";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { useMemo, useState, useEffect } from "react";

interface ShoppingListViewProps {
  todoQuery: ReturnType<typeof import("../hooks/useTodoItems").useTodoItems>;
  mutations: ReturnType<typeof import("../hooks/useTodoMutations").useTodoMutations>;
  isOnline: boolean;
}

export function ShoppingListView({ todoQuery, mutations, isOnline }: ShoppingListViewProps) {
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
    isRefetching,
    data,
  } = todoQuery;

  const { addNew, toggle } = mutations;

  // Track if disconnected long enough to show message
  const [showDisconnected, setShowDisconnected] = useState(false);

  // Only show disconnected message after 2 seconds of being disconnected
  useEffect(() => {
    if (!wsConnected && isOnline) {
      const timer = setTimeout(() => {
        setShowDisconnected(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowDisconnected(false);
    }
  }, [wsConnected, isOnline]);

  // Count pending changes
  const pendingCount = useMemo(() => {
    return (data || []).filter((item) => item._pending).length;
  }, [data]);

  // Determine unified status message
  const statusMessage = useMemo(() => {
    if (!isOnline && pendingCount > 0) {
      return {
        text: `Offline - ${pendingCount} change${pendingCount !== 1 ? "s" : ""} pending`,
        icon: "📵",
        show: true,
      };
    }
    if (!isOnline) {
      return {
        text: "Offline",
        icon: "📵",
        show: true,
      };
    }
    if (showDisconnected) {
      return {
        text: "Disconnected. Pull down to reconnect.",
        icon: "🔴",
        show: true,
      };
    }
    if (pendingCount > 0) {
      return {
        text: `Syncing ${pendingCount} change${pendingCount !== 1 ? "s" : ""}...`,
        icon: "🔄",
        show: true,
      };
    }
    return { text: "", icon: "", show: false };
  }, [isOnline, pendingCount, showDisconnected]);

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
      {/* Unified Status Bar */}
      {statusMessage.show && (
        <View
          style={{
            position: "absolute",
            bottom: 70,
            left: 10,
            right: 10,
            zIndex: 1000,
            padding: 12,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 8,
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: theme.colors.onSurfaceVariant,
              fontSize: 13,
            }}
          >
            {statusMessage.icon} {statusMessage.text}
          </Text>
        </View>
      )}
      <ScrollView
        style={{ height: "100%" }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
      >
        <List.Section>
          {todo?.map((item: TodoItem) => (
            <List.Item
              key={item.uid}
              title={item.summary}
              onPress={() => toggle.mutate(item)}
              left={(props) => (
                <List.Icon
                  {...props}
                  color={
                    item.status === "completed"
                      ? theme.colors.primary
                      : theme.colors.secondary
                  }
                  icon={
                    item.status === "completed"
                      ? "checkbox-marked"
                      : "checkbox-blank-outline"
                  }
                />
              )}
              right={() => <SyncStatusBadge isPending={item._pending} />}
            />
          ))}
        </List.Section>
        {completed && completed.length > 0 && (
          <List.Section>
            <List.Subheader>Completed</List.Subheader>
            {completed?.map((item: TodoItem) => (
            <List.Item
              key={item.uid}
              title={item.summary}
              onPress={() => toggle.mutate(item)}
              left={(props) => (
                <List.Icon
                  {...props}
                  color={
                    item.status === "completed"
                      ? theme.colors.primary
                      : theme.colors.secondary
                  }
                  icon={
                    item.status === "completed"
                      ? "checkbox-marked"
                      : "checkbox-blank-outline"
                  }
                />
              )}
              right={() => <SyncStatusBadge isPending={item._pending} />}
            />
          ))}
          </List.Section>
        )}
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
        <AddItemInput addMutation={addNew} />
      </View>
    </>
  );
}
