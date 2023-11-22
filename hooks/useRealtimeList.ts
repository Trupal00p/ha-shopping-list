import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSnack } from "../components/SnackContext";
import isValidHostname from "is-valid-hostname";
import ky from "ky";
import { useSettings } from "../components/SettingContext";

export const useRealtimeList = () => {
  const queryClient = useQueryClient();
  const setSnackText = useSnack();

  const {
    settings: { apiKey, host },
    requestOptions,
  } = useSettings();

  const query = useQuery({
    queryKey: ["shopping_list", host, apiKey],
    enabled: !!apiKey && !!host,
    retry: false,
    queryFn: async () => {
      return (await ky.get("api/shopping_list", requestOptions).json()) || [];
    },
  });

  const [wsCount, setWsCount] = useState(0);
  const [effectKey, setEffectKey] = useState(false);

  useEffect(() => {
    if (apiKey && host && isValidHostname(host)) {
      try {
        const ws = new WebSocket(`wss://${host}/api/websocket`);
        ws.addEventListener("error", (errorEvent) => {
          setSnackText("Unable to Connect to Home Assistant WebSocket [Error]");
        });
        ws.addEventListener("close", (errorEvent) => {
          setSnackText("Disconnected Home Assistant WebSocket [Closed]");
        });
        ws.addEventListener("open", (event) => {
          setWsCount((c) => c + 1);
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
              // logged in/connected
              ws.send(
                JSON.stringify({
                  type: "subscribe_events",
                  event_type: "shopping_list_updated",
                  id: 49, //TODO randomize ID here
                })
              );
              break;
            case "event":
              if (message.event.event_type === "shopping_list_updated") {
                // const update = message.event.data.item;
                switch (message.event.data.action) {
                  case "update":
                  case "add":
                  case "remove":
                  case "clear":
                  case "reorder":
                    queryClient.invalidateQueries({
                      queryKey: ["shopping_list"],
                    });
                    break;
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
          setWsCount((c) => c - 1);
        };
      } catch (e) {
        console.log("ws error", e);
      }
    }
  }, [apiKey, host, queryClient, setWsCount, effectKey]);

  const { completed, todo } =
    query.data?.reduce(
      (acc, item) => {
        if (item.complete) {
          acc.completed.push(item);
        } else {
          acc.todo.push(item);
        }
        return acc;
      },
      { completed: [], todo: [] }
    ) || {};

  return {
    ...query,
    completed,
    todo,
    wsConnected: wsCount > 0,
    reconnectWs: () => {
      setEffectKey((c) => !c);
    },
  };
};
