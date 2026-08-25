import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Correo invalido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const magicLinkSchema = z.object({
  email: z.string().trim().email("Correo invalido"),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Tu nombre es requerido"),
  organizationName: z.string().trim().min(1, "El nombre del negocio es requerido"),
  email: z.string().trim().email("Correo invalido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type SignupInput = z.infer<typeof signupSchema>;
