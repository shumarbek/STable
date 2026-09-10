import { z } from "zod";

/**
 * Custom category creation schema (spec section 103). Slugs are
 * generated server-side from the name to guarantee the
 * `^[a-z0-9-]+$` format required by the database constraint.
 */
export const customCategorySchema = z.object({
  name: z.string().trim().min(2, "Nomi kamida 2 belgidan iborat bo'lsin").max(80),
  parentId: z.string().uuid().optional().nullable(),
  icon: z.string().max(8).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Rang formati noto'g'ri")
    .optional(),
  type: z.enum(["expense", "income", "transfer"]).default("expense"),
});

export type CustomCategoryValues = z.infer<typeof customCategorySchema>;

/** Generates a URL/slug-safe identifier from a display name. */
export function slugifyCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}
