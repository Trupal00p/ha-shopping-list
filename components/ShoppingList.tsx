import { RefreshControl, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
  ActivityIndicator,
  Button,
  Icon,
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

const plural = (count: number, word: string) =>
  `${count} ${word}${count !== 1 ? "s" : ""}`;

function TodoRow({
  item,
  onToggle,
}: {
  item: TodoItem;
  onToggle: (item: TodoItem) => void;
}) {
  const theme = useTheme();
  const isCompleted = item.status === "completed";
  return (
    <List.Item
      title={item.summary}
      titleStyle={
        isCompleted
          ? {
              textDecorationLine: "line-through",
              color: theme.colors.onSurfaceDisabled,
            }
          : undefined
      }
      onPress={() => onToggle(item)}
      left={(props) => (
        <List.Icon
          {...props}
          color={isCompleted ? theme.colors.primary : theme.colors.secondary}
          icon={isCompleted ? "checkbox-marked" : "checkbox-blank-outline"}
        />
      )}
      right={() => <SyncStatusBadge isPending={item._pending} />}
    />
  );
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
    pendingCount,
    isWaitingToSync,
  } = todoQuery;

  const { add, toggle } = mutations;

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

  // Determine unified status message
  const statusMessage = useMemo(() => {
    const changes = plural(pendingCount, "change");
    if (!isOnline) {
      return {
        icon: "cloud-off-outline",
        text:
          pendingCount > 0
            ? `Offline · ${changes} saved on this phone`
            : "Offline · showing your saved list",
      };
    }
    if (isWaitingToSync) {
      return {
        icon: "cloud-alert",
        text: `Weak connection · ${changes} will sync automatically`,
      };
    }
    if (pendingCount > 0) {
      return { icon: "cloud-upload-outline", text: `Syncing ${changes}…` };
    }
    if (isError) {
      return {
        icon: "cloud-alert",
        text: "Can't reach Home Assistant · showing your saved list",
      };
    }
    if (showDisconnected) {
      return { icon: "sync", text: "Reconnecting to Home Assistant…" };
    }
    return null;
  }, [isOnline, isWaitingToSync, pendingCount, isError, showDisconnected]);

  const onRefresh = () => {
    refetch();
    reconnectWs();
  };

  if (isLoading) {
    return (
      <View style={{ padding: 30 }}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  // Only take over the screen if there is no saved list to fall back on
  if (isError && !data) {
    return (
      <View style={{ padding: 30, alignItems: "center", gap: 16 }}>
        <Icon source="cloud-alert" size={48} color={theme.colors.outline} />
        <Text variant="titleMedium">Can't reach Home Assistant</Text>
        <Text style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}>
          {error?.message}
        </Text>
        <Button mode="contained-tonal" onPress={onRefresh}>
          Try again
        </Button>
      </View>
    );
  }


  return (
    <>
      {/* Unified Status Bar */}
      {statusMessage && (
        <View
          style={{
            position: "absolute",
            bottom: 80,
            left: 10,
            right: 10,
            zIndex: 1000,
            paddingVertical: 10,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 8,
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
        >
          <Icon
            source={statusMessage.icon}
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            style={{
              flexShrink: 1,
              color: theme.colors.onSurfaceVariant,
              fontSize: 13,
            }}
          >
            {statusMessage.text}
          </Text>
        </View>
      )}
      <ScrollView
        style={{ height: "100%" }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
      >
        {todo.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center", gap: 12 }}>
            <Icon
              source={completed.length > 0 ? "cart-check" : "cart-outline"}
              size={48}
              color={theme.colors.outline}
            />
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {completed.length > 0
                ? "All done!"
                : "Nothing on the list. Add something below."}
            </Text>
          </View>
        ) : (
          <List.Section>
            {todo.map((item) => (
              <TodoRow key={item.uid} item={item} onToggle={toggle} />
            ))}
          </List.Section>
        )}
        {completed.length > 0 && (
          <List.Section>
            <List.Subheader>Completed ({completed.length})</List.Subheader>
            {completed.map((item) => (
              <TodoRow key={item.uid} item={item} onToggle={toggle} />
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
        <AddItemInput onAdd={add} />
      </View>
    </>
  );
}
