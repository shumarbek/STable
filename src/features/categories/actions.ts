"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { customCategorySchema, slugifyCategoryName } from "@/lib/validators/category";

export type CategoryActionResult = { error: string } | { success: true };

export async function createCustomCategory(
  input: unknown
): Promise<CategoryActionResult> {
  const parsed = customCategorySchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "Sessiya topilmadi." };
  }

  const baseSlug = slugifyCategoryName(parsed.data.name) || "kategoriya";
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

  const { error } = await supabase.from("categories").insert({
    user_id: userData.user.id,
    parent_id: parsed.data.parentId ?? null,
    name: parsed.data.name,
    slug: uniqueSlug,
    icon: parsed.data.icon ?? null,
    color: parsed.data.color ?? null,
    type: parsed.data.type,
    is_default: false,
  });

  if (error) {
    return { error: "Kategoriya yaratishda xatolik yuz berdi." };
  }

  revalidatePath("/transactions/new");
  revalidatePath("/settings/categories");
  return { success: true };
}

/**
 * Users may hide default categories they don't use, without deleting
 * them (spec section 103). This only affects their own visibility —
 * implemented by inserting a per-user override is out of scope for MVP,
 * so instead we simply deactivate custom categories the user owns.
 * Default (system) categories cannot be deactivated by design, since
 * `categories_update_own` RLS policy restricts updates to rows where
 * `user_id = auth.uid()`.
 */
export async function deactivateCustomCategory(
  categoryId: string
): Promise<CategoryActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: false })
    .eq("id", categoryId);

  if (error) {
    return { error: "Kategoriyani o'chirishda xatolik yuz berdi." };
  }

  revalidatePath("/settings/categories");
  return { success: true };
}
