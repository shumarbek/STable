import type { Category } from "@/types/database";

export interface CategoryHierarchyEntry {
  category: Category;
  root: Category;
}

export function buildCategoryHierarchy(categories: Category[]) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const hierarchy = new Map<string, CategoryHierarchyEntry>();
  for (const category of categories) {
    let root = category;
    const visited = new Set<string>();
    while (root.parent_id && byId.has(root.parent_id) && !visited.has(root.id)) {
      visited.add(root.id);
      root = byId.get(root.parent_id)!;
    }
    hierarchy.set(category.id, { category, root });
  }
  return hierarchy;
}

export function descendantCategoryIds(categories: Category[], rootId: string) {
  const hierarchy = buildCategoryHierarchy(categories);
  return categories.filter((category) => hierarchy.get(category.id)?.root.id === rootId).map((category) => category.id);
}
