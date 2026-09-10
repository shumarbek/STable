import { z } from "zod";

export const goalFormSchema = z.object({
  name: z.string().trim().min(1, "Nomi kiritilishi shart").max(100),
  targetAmount: z.coerce.number().positive("Maqsad summasi musbat bo'lishi kerak"),
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.string().optional().nullable(),
});

export type GoalFormInput = z.input<typeof goalFormSchema>;
export type GoalFormValues = z.output<typeof goalFormSchema>;
