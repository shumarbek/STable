import { revalidatePath } from "next/cache";

/**
 * Mutations affect balances, summaries, reports and navigation-prefetched
 * pages at the same time. Invalidating the app layout clears the client
 * router cache so the next navigation always receives fresh user data.
 */
export function revalidateAppData() {
  revalidatePath("/", "layout");
}
