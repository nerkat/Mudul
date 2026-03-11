import { useRepo } from "./useRepo";
import type { NodeBase } from "../core/types";

export function useNode(id: string): NodeBase | null {
  const repo = useRepo();
  return repo.getNode(id);
}