import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const useReactQuerySubscription = (apiKey?: string, host?: string) => {
  const queryClient = useQueryClient();

  console.log(host);
  useEffect(() => {
    if (apiKey && host) {
      const ws = new WebSocket(`wss://${host}/api/websocket`);
      // when data is received from the socket connection to the server,
      // if it is a message and for the appropriate channel,
      // update our query result with the received message
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
    }
  }, [apiKey, host, queryClient]);
};
