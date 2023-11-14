// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ResultMessage, ShoppingItem, ShoppingList } from "./types";
import type { RootState } from "./store";

// Define a service using a base URL and expected endpoints
export const homeAssistantShoppingListApi = createApi({
  reducerPath: "homeAssistantShoppingListApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `https://${host}/api`,
    prepareHeaders: (headers, { getState, extra, endpoint, type, forced }) => {
      // const token = (getState() as RootState).auth.token; //TODO update token location
      const token = api_key;

      // If we have a token set in state, let's assume that we should be passing it.
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
    },
  }),
  endpoints: (builder) => ({
    getShoppingList: builder.query<ShoppingList, void>({
      query: () => `/shopping_list`,
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        // create a websocket connection when the cache subscription starts
        const ws = new WebSocket(`wss://${host}/api/websocket`);
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded;

          // when data is received from the socket connection to the server,
          // if it is a message and for the appropriate channel,
          // update our query result with the received message
          const listener = (event: MessageEvent) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
              case "auth_required":
                // const token = (getState() as RootState).auth.token; //TODO update token location
                const token = api_key;

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
                  const update = message.event.data.item;
                  switch (message.event.data.action) {
                    case "update":
                      updateCachedData((draft) => {
                        const item = draft.find((i) => (i.id = update.id));
                        if (item) {
                          item.complete = update.complete;
                          item.name = update.name;
                        }
                      });
                      break;
                    case "add":
                      updateCachedData((draft) => {
                        draft.push(update);
                      });
                      break;
                    case "remove":
                      updateCachedData((draft) => {
                        const index = draft.findIndex(
                          (i) => (i.id = update.id)
                        );
                        if (index >= 0) {
                          delete draft[index];
                        }
                      });
                      break;
                    case "reorder":
                      // somehow refresh query
                      break;
                  }
                }
                break;
              default:
                break;
            }
          };

          ws.addEventListener("message", listener);
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved;
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        ws.close();
      },
    }),
    createItem: builder.mutation<ShoppingList, ShoppingItem>({
      query: (item) => ({
        url: `/shopping_list/item`,
        method: "POST",
        body: item,
      }),
    }),
    updateItem: builder.mutation<ShoppingList, ShoppingItem>({
      query: (item) => ({
        url: `/shopping_list/item/${item.id}`,
        method: "POST",
        body: item,
      }),
    }),
    clearCompletedItems: builder.mutation<ResultMessage, void>({
      query: () => `/shopping_list/clear_completed`,
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetShoppingListQuery } = homeAssistantShoppingListApi;
