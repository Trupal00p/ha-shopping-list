import { useQuery } from "@tanstack/react-query";
import ky from "ky";
import { useSettings } from "../components/SettingContext";

export interface TodoEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name: string;
    supported_features: number;
    icon?: string;
  };
}

export interface TodoList {
  id: string;
  name: string;
  entity_id: string;
  icon?: string;
}

export const useTodoLists = () => {
  const { requestOptions } = useSettings();

  const query = useQuery<TodoList[]>({
    queryKey: ["todo_lists"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      // Fetch all entities and filter for todo entities
      const entities = (await ky
        .get("api/states", requestOptions)
        .json()) as TodoEntity[];

      const todoLists = entities
        .filter(
          (entity) =>
            entity.entity_id.startsWith("todo.") &&
            entity.state !== "unavailable"
        )
        .map((entity) => ({
          id: entity.entity_id.replace("todo.", ""),
          name: entity.attributes.friendly_name || entity.entity_id,
          entity_id: entity.entity_id,
          icon: entity.attributes.icon,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return todoLists;
    },
  });

  return query;
};
