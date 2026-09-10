import { z } from "zod";

export const signUpSchema = z
  .object({
    email: z.string().trim().email("Email noto'g'ri formatda"),
    password: z
      .string()
      .min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak")
      .max(72, "Parol juda uzun")
      .regex(/[A-Za-z]/, "Parolda kamida bitta harf bo'lishi kerak")
      .regex(/[0-9]/, "Parolda kamida bitta raqam bo'lishi kerak"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parollar mos kelmadi",
    path: ["confirmPassword"],
  });

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Email noto'g'ri formatda"),
  password: z.string().min(1, "Parolni kiriting"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const resetPasswordRequestSchema = z.object({
  email: z.string().trim().email("Email noto'g'ri formatda"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak")
      .regex(/[A-Za-z]/, "Parolda kamida bitta harf bo'lishi kerak")
      .regex(/[0-9]/, "Parolda kamida bitta raqam bo'lishi kerak"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parollar mos kelmadi",
    path: ["confirmPassword"],
  });

export const onboardingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Ismingizni kiriting")
    .max(120, "Ism juda uzun"),
  universityName: z
    .string()
    .trim()
    .min(2, "Universitet nomini kiriting")
    .max(200, "Nom juda uzun"),
  faculty: z.string().trim().max(150).optional(),
  course: z.string().trim().max(50).optional(),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;
