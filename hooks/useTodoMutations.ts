import { useMutation, useQueryClient } from "@tanstack/react-query";
import ky from "ky";
import { TodoItem, TodoList } from "../types";
import { useSettings } from "../components/SettingContext";
import { useSnack } from "../components/SnackContext";
import { onlineManager } from "@tanstack/react-query";

export function useTodoMutations(entityId?: string) {
  const { requestOptions } = useSettings();
  const queryClient = useQueryClient();
  const setSnackText = useSnack();

  const toggle = useMutation({
    mutationFn: (item: TodoItem) => {
      const newStatus = item.status === "completed" ? "needs_action" : "completed";
      return ky.post(`api/services/todo/update_item`, {
        ...requestOptions,
        json: {
          entity_id: entityId,
          item: item.uid,
          status: newStatus,
        },
      });
    },
    networkMode: "offlineFirst",
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onMutate: async (item: TodoItem) => {
      await queryClient.cancelQueries({ queryKey: ["todo_items", entityId] });
      const previousList: TodoList =
        queryClient.getQueryData(["todo_items", entityId]) || [];

      const itemIndex = previousList.findIndex((i) => i.uid === item.uid);

      let newList = [...previousList];
      newList[itemIndex] = {
        ...item,
        status: item.status === "completed" ? "needs_action" : "completed",
        _pending: true,
        _timestamp: Date.now(),
      };

      queryClient.setQueryData(["todo_items", entityId], newList);

      return { previousList, item };
    },
    onSuccess: (data, item) => {
      const currentList: TodoList =
        queryClient.getQueryData(["todo_items", entityId]) || [];
      const updated = currentList.map((i) =>
        i.uid === item.uid ? { ...i, _pending: false } : i
      );
      queryClient.setQueryData(["todo_items", entityId], updated);
    },
    onError: (err, item, context) => {
      const isOnline = onlineManager.isOnline();
      if (isOnline) {
        // Only show error if we're online - offline state is shown in status bar
        setSnackText("Failed To Save");
        queryClient.setQueryData(["todo_items", entityId], context?.previousList);
      }
    },
  });

  const clearCompleted = useMutation({
    mutationFn: async (completedItems: TodoItem[]) => {
      if (completedItems.length === 0) {
        return;
      }

      // Call remove_item with all completed item UIDs
      const uids = completedItems.map((item) => item.uid);

      await ky.post(`api/services/todo/remove_item`, {
        ...requestOptions,
        json: {
          entity_id: entityId,
          item: uids,
        },
      });
    },
    networkMode: "offlineFirst",
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onMutate: async (completedItems: TodoItem[]) => {
      await queryClient.cancelQueries({ queryKey: ["todo_items", entityId] });
      const previousList: TodoList =
        queryClient.getQueryData(["todo_items", entityId]) || [];

      // Remove the completed items by their UIDs
      const completedUids = completedItems.map(item => item.uid);
      let newList = previousList.filter((i) => !completedUids.includes(i.uid));

      queryClient.setQueryData(["todo_items", entityId], newList);

      return { previousList };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todo_items", entityId] });
    },
    onError: (err, variables, context) => {
      const isOnline = onlineManager.isOnline();
      if (isOnline) {
        // Only show error if we're online - offline state is shown in status bar
        setSnackText("Failed To Clear Completed");
        queryClient.setQueryData(["todo_items", entityId], context?.previousList);
      }
    },
  });

  const addNew = useMutation({
    mutationFn: (summary: string) =>
      ky.post(`api/services/todo/add_item`, {
        ...requestOptions,
        json: {
          entity_id: entityId,
          item: summary,
        },
      }),
    networkMode: "offlineFirst",
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onMutate: async (summary: string) => {
      await queryClient.cancelQueries({ queryKey: ["todo_items", entityId] });
      const previousList: TodoList =
        queryClient.getQueryData(["todo_items", entityId]) || [];

      const tempId = `temp-${(Math.random() + 1).toString(36).substring(7)}`;
      let newList = [
        ...previousList,
        {
          summary,
          status: "needs_action" as const,
          uid: tempId,
          _pending: true,
          _timestamp: Date.now(),
        },
      ];

      queryClient.setQueryData(["todo_items", entityId], newList);
      return { previousList, summary, tempId };
    },
    onSuccess: (data, summary, context) => {
      queryClient.invalidateQueries({ queryKey: ["todo_items", entityId] });
    },
    onError: (err, summary, context) => {
      const isOnline = onlineManager.isOnline();
      if (isOnline) {
        // Only show error if we're online - offline state is shown in status bar
        setSnackText("Failed To Add Item");
        queryClient.setQueryData(["todo_items", entityId], context?.previousList);
      }
    },
  });

  return { toggle, addNew, clearCompleted };
}
