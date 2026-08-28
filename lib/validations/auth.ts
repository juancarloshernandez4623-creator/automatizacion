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

// No hay ya un /signup: el servicio es de pago y no existe el registro
// abierto en ningun sitio. Un cliente entra unicamente con el codigo de
// acceso PERMANENTE que el dueño de la plataforma genera y le entrega desde
// /admin/invites (ese mismo codigo crea la cuenta en el momento de
// generarlo, ver app/admin/invites/actions.ts).
export const accessCodeSchema = z.object({
  code: z.string().trim().min(1, "El código de acceso es obligatorio"),
});

export type AccessCodeInput = z.infer<typeof accessCodeSchema>;
