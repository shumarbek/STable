import { z } from "zod";

/**
 * Shared transaction validation schema. Mirrors the database
 * constraints in supabase/migrations/003_transactions.sql so invalid
 * input is rejected client-side with a clear message *before* hitting
 * the database — the database remains the final authority (defense in
 * depth), but this keeps the UX fast and friendly.
 */

export const transactionTypeEnum = z.enum([
  "expense",
  "income",
  "transfer",
  "loan",
  "debt_repayment",
  "refund",
]);

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Sana noto'g'ri formatda");

export const transactionItemSchema = z.object({
  itemType: z.string().min(1).max(60),
  itemName: z.string().trim().min(1, "Nomi kiritilishi shart").max(100),
  quantity: z.coerce.number().positive("Miqdor musbat bo'lishi kerak").default(1),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const transactionFormSchema = z
  .object({
    transactionType: transactionTypeEnum,
    accountId: z.string().uuid("Hisobni tanlang"),
    transferAccountId: z.string().uuid().optional().nullable(),
    categoryId: z.string().uuid("Kategoriyani tanlang").optional().nullable(),
    amount: z.coerce
      .number({ error: "Summani kiriting" })
      .min(0, "Summa manfiy bo'lishi mumkin emas"),
    transactionDate: isoDateString,
    isZeroConsumption: z.boolean().default(false),
    note: z.string().trim().max(500, "Izoh 500 belgidan oshmasligi kerak").optional(),
    location: z.string().trim().max(200).optional(),
    tagIds: z.array(z.string().uuid()).optional().default([]),
    items: z.array(transactionItemSchema).optional().default([]),
    idempotencyKey: z.string().optional(),
  })
  .refine(
    (data) => data.amount > 0 || data.isZeroConsumption,
    {
      message: "Summa 0 bo'lishi faqat uyda tayyorlangan ovqat uchun mumkin",
      path: ["amount"],
    }
  )
  .refine(
    (data) =>
      data.transactionType !== "transfer" ||
      (!!data.transferAccountId && data.transferAccountId !== data.accountId),
    {
      message: "Pul o'tkazmasi uchun boshqa hisobni tanlang",
      path: ["transferAccountId"],
    }
  )
  .refine(
    (data) => {
      const today = new Date().toISOString().slice(0, 10);
      return data.transactionDate <= today;
    },
    {
      message: "Kelajakdagi sanani tanlash mumkin emas",
      path: ["transactionDate"],
    }
  );

export type TransactionFormInput = z.input<typeof transactionFormSchema>;
export type TransactionFormValues = z.output<typeof transactionFormSchema>;
