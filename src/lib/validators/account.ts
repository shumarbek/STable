import { z } from "zod";

export const accountTypeEnum = z.enum(["cash", "card", "bank", "ewallet", "other"]);

export const accountFormSchema = z.object({
  name: z.string().trim().min(1, "Nomi kiritilishi shart").max(60),
  type: accountTypeEnum,
  currency: z.string().trim().length(3).default("UZS"),
  initialBalance: z.coerce.number().default(0),
});

export type AccountFormInput = z.input<typeof accountFormSchema>;
export type AccountFormValues = z.output<typeof accountFormSchema>;

export const balanceConversionSchema = z.object({
  direction: z.enum(["cash_to_card", "card_to_cash"]),
  amount: z.coerce.number().positive("Konvertatsiya summasini kiriting"),
  conversionDate: z.iso.date(),
  note: z.string().trim().max(200, "Izoh 200 belgidan oshmasligi kerak").optional(),
  idempotencyKey: z.uuid(),
});

export type BalanceConversionInput = z.input<typeof balanceConversionSchema>;

export const accountTypeLabels: Record<z.infer<typeof accountTypeEnum>, string> = {
  cash: "Naqd",
  card: "Karta",
  bank: "Bank",
  ewallet: "Elektron hamyon",
  other: "Boshqa",
};
