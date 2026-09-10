import { z } from "zod";

export const budgetFormSchema = z.object({
  name: z.string().trim().min(1, "Nomi kiritilishi shart").max(100),
  categoryId: z.string().uuid().optional().nullable(),
  amountLimit: z.coerce.number().positive("Summa musbat bo'lishi kerak"),
  period: z.enum(["weekly", "monthly", "yearly"]).default("monthly"),
  warningThresholdPercent: z.coerce.number().min(1).max(100).default(70),
});

export type BudgetFormInput = z.input<typeof budgetFormSchema>;
export type BudgetFormValues = z.output<typeof budgetFormSchema>;

export const periodLabels: Record<BudgetFormValues["period"], string> = {
  weekly: "Haftalik",
  monthly: "Oylik",
  yearly: "Yillik",
};
