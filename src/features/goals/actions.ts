"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { goalFormSchema } from "@/lib/validators/goal";

export type GoalActionResult = { error: string } | { success: true };

export async function createGoal(input: unknown): Promise<GoalActionResult> {
  const parsed = goalFormSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "Sessiya topilmadi." };
  }

  const { error } = await supabase.from("goals").insert({
    user_id: userData.user.id,
    name: parsed.data.name,
    target_amount: parsed.data.targetAmount,
    current_amount: parsed.data.currentAmount,
    deadline: parsed.data.deadline || null,
  });

  if (error) {
    return { error: "Maqsad yaratishda xatolik yuz berdi." };
  }

  revalidatePath("/goals");
  return { success: true };
}

export async function updateGoalProgress(
  goalId: string,
  currentAmount: number
): Promise<GoalActionResult> {
  const supabase = await createClient();
  const { data: goal } = await supabase
    .from("goals")
    .select("target_amount")
    .eq("id", goalId)
    .maybeSingle();

  const isCompleted = goal ? currentAmount >= goal.target_amount : false;

  const { error } = await supabase
    .from("goals")
    .update({ current_amount: currentAmount, is_completed: isCompleted })
    .eq("id", goalId);

  if (error) {
    return { error: "Maqsadni yangilashda xatolik yuz berdi." };
  }

  revalidatePath("/goals");
  return { success: true };
}

export async function deleteGoal(goalId: string): Promise<GoalActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", goalId);

  if (error) {
    return { error: "Maqsadni o'chirishda xatolik yuz berdi." };
  }

  revalidatePath("/goals");
  return { success: true };
}
