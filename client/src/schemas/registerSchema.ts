import { ACCOUNT_TYPES } from "@/lib/constants";
import { z } from "zod";

export const registerSchema = z
  .object({
    accountType: z.enum(ACCOUNT_TYPES),
    names: z.string().optional(),
    lastNames: z.string().optional(),
    email: z
      .string({
        required_error: "El correo electrónico es requerido",
      })
      .email({ message: "El correo electrónico no es válido" }),
    password: z
      .string({
        required_error: "La contraseña es requerida",
      })
      .min(8, {
        message: "La contraseña debe tener como mínimo 8 caracteres",
      }),
    confirmPassword: z.string({
      required_error: "La confirmación de contraseña es requerida",
    }),
  })
  .superRefine((data, ctx) => {
    // Validar contraseña
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden",
      });
    }

    // Validar correo institucional
    if (
      data.accountType === ACCOUNT_TYPES[0] &&
      !data.email.endsWith("@unmsm.edu.pe")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Debes usar un correo institucional de la UNMSM",
      });
    }
  });

export type RegisterForm = z.infer<typeof registerSchema>;
