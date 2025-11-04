// Todo item from Home Assistant todo integration
export type TodoItem = {
  uid: string;
  summary: string;
  status: "needs_action" | "completed";
  _pending?: boolean; // Local-only: indicates item has unsaved changes
  _timestamp?: number; // Local-only: timestamp of last local change
};

// Legacy shopping list item (kept for reference)
export type ShoppingItem = {
  name: string;
  id: string | undefined;
  complete: boolean;
  _pending?: boolean;
  _timestamp?: number;
};

export type TodoList = Array<TodoItem>;
export type ShoppingList = Array<ShoppingItem>;

export type ResultMessage = { message: string };
