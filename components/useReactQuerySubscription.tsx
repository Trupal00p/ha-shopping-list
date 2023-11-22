import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSnack } from "./SnackContext";
import isValidHostname from "is-valid-hostname";

export const useReactQuerySubscription = (apiKey?: string, host?: string) => {
  const queryClient = useQueryClient();
  const setSnackText = useSnack();

  useEffect(() => {
    if (apiKey && host && isValidHostname(host)) {
      try {
        const ws = new WebSocket(`wss://${host}/api/websocket`);
        ws.addEventListener("error", (errorEvent) => {
          setSnackText("Unable to Connect to Home Assistant WebSocket");
        });
        ws.addEventListener("close", (errorEvent) => {
          setSnackText("Disconnected Home Assistant WebSocket");
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
        };
      } catch (e) {
        console.log("ws error", e);
      }
    }
  }, [apiKey, host, queryClient]);
};
