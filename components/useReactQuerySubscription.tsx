import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const useReactQuerySubscription = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const ws = new WebSocket(
      `wss://${process.env.EXPO_PUBLIC_API_HOST}/api/websocket`
    );
    // when data is received from the socket connection to the server,
    // if it is a message and for the appropriate channel,
    // update our query result with the received message
    const listener = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case "auth_required":
          // const token = (getState() as RootState).auth.token; //TODO update token location
          const token = `${process.env.EXPO_PUBLIC_API_KEY}`;

          ws.send(
            JSON.stringify({
              type: "auth",
              access_token: token,
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
  }, [queryClient]);
};
