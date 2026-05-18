import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().optional(),
    email: z
      .string({
        invalid_type_error:
          "El correo electrónico debe ser una cadena de texto",
        required_error: "El correo electrónico es requerido",
      })
      .email({ message: "El correo electrónico no es válido" }),
    password: z
      .string({
        invalid_type_error: "La contraseña debe ser una cadena de texto",
        required_error: "La contraseña es requerida",
      })
      .min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string({
      invalid_type_error:
        "La confirmación de contraseña debe ser una cadena de texto",
      required_error: "La confirmación de contraseña es requerida",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterForm = z.infer<typeof registerSchema>;
