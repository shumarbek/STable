import { describe, expect, it } from "vitest";
import { buildCategoryHierarchy, descendantCategoryIds } from "@/features/categories/hierarchy";
import type { Category } from "@/types/database";

function category(id: string, name: string, parentId: string | null): Category {
  return {
    id, name, parent_id: parentId, user_id: null, slug: id, icon: null,
    color: null, type: "expense", is_default: true, is_active: true,
    is_recurring: false, sort_order: 0, created_at: "", updated_at: "",
  };
}

describe("category hierarchy", () => {
  const categories = [
    category("food", "Oziq-ovqat", null),
    category("ready", "Tayyor ovqat", "food"),
    category("lunch", "Tushlik", "ready"),
    category("transport", "Transport", null),
    category("metro", "Metro", "transport"),
  ];

  it("resolves a deeply nested item to its general category", () => {
    expect(buildCategoryHierarchy(categories).get("lunch")?.root.name).toBe("Oziq-ovqat");
  });

  it("returns every descendant used by a general-category filter", () => {
    expect(descendantCategoryIds(categories, "food")).toEqual(["food", "ready", "lunch"]);
  });
});
