import {
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { useSnack } from "../components/SnackContext";
import isValidHostname from "is-valid-hostname";
import ky from "ky";
import { useSettings } from "../components/SettingContext";
import { TodoList } from "../types";
import {
  TODO_CHANGE_KEY,
  TodoChange,
  applyPendingChanges,
  todoItemsKey,
} from "../lib/todoChanges";
import { useNetworkStatus } from "./useNetworkStatus";

const SUBSCRIPTION_ID = 1;

export const useTodoItems = (entityId?: string) => {
  const queryClient = useQueryClient();
  const setSnackText = useSnack();
  const { isOnline } = useNetworkStatus();

  const { settings, requestOptions } = useSettings();
  const { apiKey, host, useTls } = settings;

  // Strip port for hostname validation
  const hostWithoutPort = host?.split(":")[0] || "";
  const enabled =
    !!apiKey && !!host && !!entityId && isValidHostname(hostWithoutPort);

  const query = useQuery<TodoList>({
    queryKey: todoItemsKey(entityId),
    enabled,
    queryFn: async () => {
      // Call the todo.get_items service to fetch items
      const response = (await ky
        .post(`api/services/todo/get_items?return_response=true`, {
          ...requestOptions,
          json: {
            entity_id: entityId,
          },
        })
        .json()) as any;

      // The service returns items in service_response[entity_id].items
      return (entityId && response?.service_response?.[entityId]?.items) || [];
    },
  });

  // Changes made on this device that Home Assistant hasn't confirmed yet
  const allPending = useMutationState({
    filters: { mutationKey: TODO_CHANGE_KEY, status: "pending" },
    select: (mutation) => ({
      change: mutation.state.variables as TodoChange,
      waiting: mutation.state.isPaused || mutation.state.failureCount > 0,
    }),
  });

  const pending = useMemo(
    () => allPending.filter(({ change }) => change.entityId === entityId),
    [allPending, entityId]
  );
  const pendingChanges = useMemo(
    () => pending.map(({ change }) => change),
    [pending]
  );
  const isWaitingToSync = pending.some(({ waiting }) => waiting);

  const items = useMemo(
    () => applyPendingChanges(query.data || [], pendingChanges),
    [query.data, pendingChanges]
  );

  const { completed, todo } = useMemo(
    () => ({
      completed: items.filter((item) => item.status === "completed"),
      todo: items.filter((item) => item.status !== "completed"),
    }),
    [items]
  );

  const [wsConnected, setWsConnected] = useState(false);
  const [effectKey, setEffectKey] = useState(false);

  // Live updates via Home Assistant's todo item subscription, which pushes
  // just this list's items instead of every state change in the house
  useEffect(() => {
    if (!enabled || !isOnline) {
      return;
    }

    let ws: WebSocket | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let stopped = false;

    const connect = () => {
      clearTimeout(retryTimer);
      const socket = new WebSocket(
        `ws${useTls ? "s" : ""}://${host}/api/websocket`
      );
      ws = socket;

      socket.onmessage = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "auth_required":
            socket.send(JSON.stringify({ type: "auth", access_token: apiKey }));
            break;
          case "auth_ok":
            attempts = 0;
            setWsConnected(true);
            socket.send(
              JSON.stringify({
                id: SUBSCRIPTION_ID,
                type: "todo/item/subscribe",
                entity_id: entityId,
              })
            );
            break;
          case "auth_invalid":
            stopped = true;
            setSnackText("WebSocket Authentication Failed");
            socket.close();
            break;
          case "result":
            // Subscription unsupported; at least sync once
            if (message.id === SUBSCRIPTION_ID && !message.success) {
              queryClient.invalidateQueries({
                queryKey: todoItemsKey(entityId),
              });
            }
            break;
          case "event":
            if (Array.isArray(message.event?.items)) {
              queryClient.setQueryData(
                todoItemsKey(entityId),
                message.event.items
              );
            }
            break;
          default:
            break;
        }
      };

      socket.onclose = () => {
        if (ws !== socket) return;
        setWsConnected(false);
        if (!stopped) {
          retryTimer = setTimeout(
            connect,
            Math.min(1000 * 2 ** attempts++, 60000)
          );
        }
      };
    };

    // Android drops sockets in the background; reconnect straight away when
    // the app comes back rather than waiting out the backoff
    const appState = AppState.addEventListener("change", (status) => {
      if (
        status === "active" &&
        !stopped &&
        ws?.readyState !== WebSocket.OPEN &&
        ws?.readyState !== WebSocket.CONNECTING
      ) {
        attempts = 0;
        connect();
      }
    });

    connect();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      appState.remove();
      ws?.close();
      setWsConnected(false);
    };
  }, [
    enabled,
    isOnline,
    effectKey,
    apiKey,
    host,
    useTls,
    entityId,
    queryClient,
    setSnackText,
  ]);

  const reconnectWs = useCallback(() => {
    setEffectKey((c) => !c);
  }, [setEffectKey]);

  return {
    ...query,
    items,
    completed,
    todo,
    pendingCount: pendingChanges.length,
    isWaitingToSync,
    wsConnected,
    reconnectWs,
  };
};
