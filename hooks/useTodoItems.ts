import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useSnack } from "../components/SnackContext";
import isValidHostname from "is-valid-hostname";
import ky from "ky";
import { useSettings } from "../components/SettingContext";
import { TodoList, TodoItem } from "../types";

interface TodoEntityState {
  entity_id: string;
  state: string;
  attributes: {
    items?: TodoItem[];
  };
}

export const useTodoItems = (entityId?: string) => {
  const queryClient = useQueryClient();
  const setSnackText = useSnack();

  const { settings, requestOptions } = useSettings();
  const { apiKey, host, useTls } = settings;

  // Strip port for hostname validation
  const hostWithoutPort = host?.split(":")[0] || "";

  const query = useQuery<TodoList>({
    queryKey: ["todo_items", entityId],
    enabled: !!apiKey && !!host && !!entityId && isValidHostname(hostWithoutPort),
    retry: false,
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
      if (
        response &&
        response.service_response &&
        entityId &&
        response.service_response[entityId] &&
        response.service_response[entityId].items
      ) {
        return response.service_response[entityId].items;
      }

      return [];
    },
  });

  const [wsCount, setWsCount] = useState(0);
  const [effectKey, setEffectKey] = useState(false);

  useEffect(() => {
    if (apiKey && host && entityId && isValidHostname(hostWithoutPort)) {
      try {
        const ws = new WebSocket(
          `ws${useTls ? "s" : ""}://${host}/api/websocket`
        );
        const subscriptionId = Math.floor(Math.random() * 100000);
        let isConnected = false;

        setWsCount((c) => c + 1);

        ws.addEventListener("error", (errorEvent) => {
          setWsCount((c) => c - 1);
        });

        ws.addEventListener("close", (errorEvent) => {
          setWsCount((c) => c - 1);
        });

        const listener = (event: MessageEvent) => {
          const message = JSON.parse(event.data);
          switch (message.type) {
            case "auth_required":
              ws.send(
                JSON.stringify({
                  type: "auth",
                  access_token: apiKey,
                })
              );
              break;
            case "auth_ok":
              isConnected = true;
              // Subscribe to state_changed events for this specific entity
              ws.send(
                JSON.stringify({
                  type: "subscribe_events",
                  event_type: "state_changed",
                  id: subscriptionId,
                })
              );
              // Invalidate on successful connection to ensure sync
              queryClient.invalidateQueries({
                queryKey: ["todo_items", entityId],
              });
              break;
            case "auth_invalid":
              setSnackText("WebSocket Authentication Failed");
              ws.close();
              break;
            case "event":
              if (message.event.event_type === "state_changed") {
                // Check if this state change is for our todo entity
                if (message.event.data.entity_id === entityId) {
                  queryClient.invalidateQueries({
                    queryKey: ["todo_items", entityId],
                  });
                }
              }
              break;
            default:
              break;
          }
        };

        ws.addEventListener("message", listener);

        return () => {
          ws.close();
        };
      } catch (e) {
        // WebSocket connection failed
      }
    }
  }, [
    settings,
    queryClient,
    setWsCount,
    effectKey,
    setSnackText,
    hostWithoutPort,
    apiKey,
    host,
    entityId,
  ]);

  const { completed, todo } =
    (query.data || []).reduce(
      (acc: { completed: TodoList; todo: TodoList }, item) => {
        if (item.status === "completed") {
          acc.completed.push(item);
        } else {
          acc.todo.push(item);
        }
        return acc;
      },
      { completed: [], todo: [] }
    ) || { completed: [], todo: [] };

  const reconnectWs = useCallback(() => {
    setEffectKey((c) => !c);
  }, [setEffectKey]);

  return {
    ...query,
    completed,
    todo,
    wsConnected: wsCount > 0,
    reconnectWs,
  };
};
