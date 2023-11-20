export type ShoppingItem = {
  name: string;
  id: string | undefined;
  complete: boolean;
};
export type ShoppingList = Array<ShoppingItem>;

export type ResultMessage = { message: string };
