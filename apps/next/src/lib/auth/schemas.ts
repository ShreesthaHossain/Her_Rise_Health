import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[A-Za-z]/, "Include a letter.")
  .regex(/[0-9]/, "Include a number.");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(1, "Enter the name you want to see.").max(80),
    email: z.string().email("Enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptedTerms: z.boolean().refine((value) => value, "Accept the terms and privacy notice to continue."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Those passwords do not match.",
  });

export const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export const resetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Those passwords do not match.",
  });

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a display name.").max(80),
  preferredLanguage: z.enum(["bn", "en"]),
  timezone: z.enum(["Asia/Dhaka", "UTC"]),
});

export const POLICY_VERSION = "2026-11-22";
