import { z } from "zod";

export const subscriptionFormSchema = z.object({
  providerName: z.string().trim().min(1, "Nomi kiritilishi shart").max(100),
  accountId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive("Summa musbat bo'lishi kerak"),
  billingCycle: z.enum(["weekly", "monthly", "yearly"]).default("monthly"),
  nextBillingDate: z.string().min(1, "Sanani kiriting"),
});

export type SubscriptionFormInput = z.input<typeof subscriptionFormSchema>;
export type SubscriptionFormValues = z.output<typeof subscriptionFormSchema>;

export const billingCycleLabels: Record<SubscriptionFormValues["billingCycle"], string> = {
  weekly: "Haftalik",
  monthly: "Oylik",
  yearly: "Yillik",
};
