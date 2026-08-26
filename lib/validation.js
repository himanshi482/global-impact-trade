import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Name is too short").max(150),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().trim().min(2).max(255).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  industry: z.string().trim().max(150).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  phone: z.string().trim().max(50).optional(),
  companyName: z.string().trim().max(255).optional(),
  website: z.string().trim().max(255).optional().or(z.literal("")),
  industry: z.string().trim().max(150).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const dutyCalculationSchema = z.object({
  hsCode: z.string().trim().min(2).max(20),
  assessableValue: z.number().positive("Assessable value must be greater than 0"),
  freight: z.number().nonnegative().optional().default(0),
  insurance: z.number().nonnegative().optional().default(0),
});

/**
 * Runs a zod schema against a parsed JSON body and returns either
 * { data } or { error } — a small helper so every route handler doesn't
 * repeat the same try/catch-and-format dance.
 */
export function validateBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message || "Invalid request";
    return { error: message };
  }
  return { data: result.data };
}
