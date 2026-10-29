// Todo item from Home Assistant todo integration
export type TodoItem = {
  uid: string;
  summary: string;
  status: "needs_action" | "completed";
  _pending?: boolean; // Local-only: set on items with changes not yet synced
};

export type TodoList = Array<TodoItem>;

export type ResultMessage = { message: string };
