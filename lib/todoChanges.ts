import { QueryClient } from "@tanstack/react-query";
import ky, { HTTPError, Options, TimeoutError } from "ky";
import { loadRequestOptions } from "../components/SettingContext";
import { TodoItem, TodoList } from "../types";

// A local edit to a todo list. Each change is queued as a React Query mutation,
// persisted to AsyncStorage while pending, and replayed in order once Home
// Assistant is reachable. Until then it is overlaid on the cached server list.
export type TodoChange =
  | { type: "add"; entityId: string; tempId: string; summary: string }
  | {
      type: "setStatus";
      entityId: string;
      uid: string;
      summary: string;
      status: TodoItem["status"];
    }
  | { type: "remove"; entityId: string; items: ItemRef[] };

type ItemRef = Pick<TodoItem, "uid" | "summary">;

export const TODO_CHANGE_KEY = ["todo_change"];

export const todoItemsKey = (entityId?: string) => ["todo_items", entityId];

const TEMP_PREFIX = "temp-";

export const newTempId = () =>
  `${TEMP_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const isTemp = (uid: string) => uid.startsWith(TEMP_PREFIX);

// Items added offline only have a temporary uid. Once the add has synced the
// real item has a server uid, so fall back to the most recent item with the
// same summary.
const findItem = (items: TodoList, ref: ItemRef) => {
  const index = items.findIndex((item) => item.uid === ref.uid);
  if (index !== -1 || !isTemp(ref.uid)) {
    return index;
  }
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].summary === ref.summary) {
      return i;
    }
  }
  return -1;
};

export function applyChange(
  items: TodoList,
  change: TodoChange,
  pending = false
): TodoList {
  switch (change.type) {
    case "add":
      return [
        ...items,
        {
          uid: change.tempId,
          summary: change.summary,
          status: "needs_action",
          _pending: pending,
        },
      ];
    case "setStatus": {
      const index = findItem(items, change);
      if (index === -1) {
        return items;
      }
      const next = [...items];
      next[index] = { ...items[index], status: change.status, _pending: pending };
      return next;
    }
    case "remove": {
      const removed = new Set(
        change.items.map((ref) => findItem(items, ref)).filter((i) => i !== -1)
      );
      return items.filter((_, i) => !removed.has(i));
    }
  }
}

export const applyPendingChanges = (items: TodoList, changes: TodoChange[]) =>
  changes.reduce((acc, change) => applyChange(acc, change, true), items);

class NetworkError extends Error {}

// fetch only rejects when no response arrived. React Native's fetch rejects
// with TypeError but Expo's (the global since SDK 56) with its own FetchError,
// so normalize both.
const fetchOrNetworkError: Options["fetch"] = (input, init) =>
  // ky always passes a Request
  fetch(input as Request, init).catch((error) => {
    throw new NetworkError(error instanceof Error ? error.message : String(error));
  });

// Bad signal shows up as fetch failures and timeouts rather than as being
// offline, so these are retried until they get through instead of discarded.
const TRANSIENT_STATUSES = [408, 429, 502, 503, 504];

export const isTransientError = (error: unknown) =>
  error instanceof NetworkError ||
  error instanceof TimeoutError ||
  (error instanceof HTTPError &&
    TRANSIENT_STATUSES.includes(error.response.status));

async function sendChange(change: TodoChange, client: QueryClient) {
  const requestOptions = await loadRequestOptions();
  const cached =
    client.getQueryData<TodoList>(todoItemsKey(change.entityId)) ?? [];

  // Home Assistant's todo services accept either a uid or a summary
  const resolve = (ref: ItemRef) => {
    if (!isTemp(ref.uid)) {
      return ref.uid;
    }
    const match = cached[findItem(cached, ref)];
    return match && !isTemp(match.uid) ? match.uid : ref.summary;
  };

  const callService = (service: string, json: object) =>
    ky.post(`api/services/todo/${service}`, {
      ...requestOptions,
      fetch: fetchOrNetworkError,
      json: { entity_id: change.entityId, ...json },
    });

  switch (change.type) {
    case "add":
      return callService("add_item", { item: change.summary });
    case "setStatus":
      return callService("update_item", {
        item: resolve(change),
        status: change.status,
      });
    case "remove":
      return callService("remove_item", { item: change.items.map(resolve) });
  }
}

// Registered before the persisted cache is restored, so changes queued in a
// previous session still know how to send themselves.
export function registerTodoChangeDefaults(queryClient: QueryClient) {
  queryClient.setMutationDefaults(TODO_CHANGE_KEY, {
    mutationFn: (change: TodoChange) => sendChange(change, queryClient),
    // One queue for all changes so they reach Home Assistant in order
    scope: { id: "todo_change" },
    retry: (failureCount, error) =>
      isTransientError(error) || failureCount < 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (_data, change: TodoChange) => {
      const key = todoItemsKey(change.entityId);
      // Keep showing the change once it stops being pending, until a refetch
      // or WebSocket update brings the server's copy
      queryClient.setQueryData<TodoList>(key, (items = []) =>
        change.type === "add" &&
        items.some(
          (item) =>
            item.summary === change.summary && item.status === "needs_action"
        )
          ? items
          : applyChange(items, change)
      );
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function resumeQueuedChanges(queryClient: QueryClient) {
  queryClient
    .getMutationCache()
    .findAll({ mutationKey: TODO_CHANGE_KEY, status: "pending" })
    .forEach((mutation) => mutation.continue().catch(() => undefined));
}
