import { createClient } from "@/lib/supabase/server";
import type { Category, CategoryType } from "@/types/database";

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

/**
 * Fetches all categories visible to the current user (system defaults +
 * their own custom categories) and builds a parent/children tree for
 * the hierarchical category picker (spec section 102).
 */
export async function getCategoryTree(type?: CategoryType): Promise<CategoryNode[]> {
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("getCategoryTree failed", error?.message);
    return [];
  }

  const rows = data as Category[];
  const byId = new Map<string, CategoryNode>();
  rows.forEach((row) => byId.set(row.id, { ...row, children: [] }));

  const roots: CategoryNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else if (!node.parent_id) {
      roots.push(node);
    }
  });

  return roots;
}

/** Flat list (no tree), useful for simple selects / lookups by id. */
export async function getFlatCategories(type?: CategoryType): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase.from("categories").select("*").eq("is_active", true);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("getFlatCategories failed", error?.message);
    return [];
  }

  return data as Category[];
}
