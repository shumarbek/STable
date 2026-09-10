"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { transactionFormSchema } from "@/lib/validators/transaction";

export type TransactionActionResult = { error: string } | { success: true };

/**
 * Creates a transaction. Duplicate-submit protection works two ways:
 *  1. Client disables the Save button while the request is in flight.
 *  2. Server generates a per-submission idempotency key (passed from the
 *     client, generated once per form mount) and relies on the
 *     `uq_transactions_idempotency` unique index — a retried/duplicated
 *     submit with the same key is silently treated as already-saved
 *     rather than creating a second row.
 */
export async function createTransaction(input: unknown): Promise<TransactionActionResult> {
  const parsed = transactionFormSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "Sessiya topilmadi. Qaytadan kiring." };
  }

  const idempotencyKey = parsed.data.idempotencyKey ?? crypto.randomUUID();

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userData.user.id,
      account_id: parsed.data.accountId,
      transfer_account_id: parsed.data.transferAccountId ?? null,
      category_id: parsed.data.categoryId ?? null,
      transaction_type: parsed.data.transactionType,
      amount: parsed.data.amount,
      transaction_date: parsed.data.transactionDate,
      is_zero_consumption: parsed.data.isZeroConsumption,
      note: parsed.data.note || null,
      location: parsed.data.location || null,
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();

  if (error) {
    // Unique violation on idempotency key means this exact submission
    // already succeeded previously — treat as success, not an error.
    if (error.code === "23505") {
      revalidatePath("/dashboard");
      revalidatePath("/transactions");
      return { success: true };
    }
    return { error: "Tranzaksiyani saqlashda xatolik yuz berdi." };
  }

  if (parsed.data.items.length > 0 && inserted) {
    await supabase.from("transaction_items").insert(
      parsed.data.items.map((item) => ({
        transaction_id: inserted.id,
        item_type: item.itemType,
        item_name: item.itemName,
        quantity: item.quantity,
        metadata: item.metadata ?? {},
      }))
    );
  }

  if (parsed.data.tagIds.length > 0 && inserted) {
    await supabase.from("transaction_tags").insert(
      parsed.data.tagIds.map((tagId) => ({
        transaction_id: inserted.id,
        tag_id: tagId,
      }))
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/calendar");
  return { success: true };
}

export async function updateTransaction(
  transactionId: string,
  input: unknown
): Promise<TransactionActionResult> {
  const parsed = transactionFormSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      account_id: parsed.data.accountId,
      transfer_account_id: parsed.data.transferAccountId ?? null,
      category_id: parsed.data.categoryId ?? null,
      transaction_type: parsed.data.transactionType,
      amount: parsed.data.amount,
      transaction_date: parsed.data.transactionDate,
      is_zero_consumption: parsed.data.isZeroConsumption,
      note: parsed.data.note || null,
      location: parsed.data.location || null,
    })
    .eq("id", transactionId);

  if (error) {
    return { error: "Tranzaksiyani yangilashda xatolik yuz berdi." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/calendar");
  return { success: true };
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", transactionId);

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/calendar");
  redirect("/transactions");
}
