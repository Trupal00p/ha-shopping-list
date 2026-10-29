import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { TodoItem } from "../types";
import { useSnack } from "../components/SnackContext";
import { TODO_CHANGE_KEY, TodoChange, newTempId } from "../lib/todoChanges";

// The request, retries and queueing live in the mutation defaults
// (lib/todoChanges.ts) so changes restored after a restart behave the same.
// Pending changes are overlaid on the list by useTodoItems.
export function useTodoMutations(entityId?: string) {
  const queryClient = useQueryClient();
  const setSnackText = useSnack();
  const { mutate } = useMutation<unknown, Error, TodoChange>({
    mutationKey: TODO_CHANGE_KEY,
  });

  // Errors reach here only once retrying has given up, e.g. Home Assistant
  // rejected the change. The overlay drops it, so the list reverts on its own.
  useEffect(
    () =>
      queryClient.getMutationCache().subscribe((event) => {
        if (
          event.type !== "updated" ||
          event.action.type !== "error" ||
          event.mutation.options.mutationKey?.[0] !== TODO_CHANGE_KEY[0]
        ) {
          return;
        }
        const change = event.mutation.state.variables as TodoChange;
        setSnackText(
          change.type === "add"
            ? `Couldn't add "${change.summary}"`
            : change.type === "setStatus"
            ? `Couldn't update "${change.summary}"`
            : "Couldn't clear completed items"
        );
      }),
    [queryClient, setSnackText]
  );

  const toggle = useCallback(
    (item: TodoItem) => {
      if (!entityId) return;
      mutate({
        type: "setStatus",
        entityId,
        uid: item.uid,
        summary: item.summary,
        status: item.status === "completed" ? "needs_action" : "completed",
      });
    },
    [entityId, mutate]
  );

  const add = useCallback(
    (summary: string) => {
      if (!entityId) return;
      mutate({ type: "add", entityId, tempId: newTempId(), summary });
    },
    [entityId, mutate]
  );

  const clearCompleted = useCallback(
    (items: TodoItem[]) => {
      if (!entityId || items.length === 0) return;
      mutate({
        type: "remove",
        entityId,
        items: items.map(({ uid, summary }) => ({ uid, summary })),
      });
    },
    [entityId, mutate]
  );

  return { toggle, add, clearCompleted };
}
