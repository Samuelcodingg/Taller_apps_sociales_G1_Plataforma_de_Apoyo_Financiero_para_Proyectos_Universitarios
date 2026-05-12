import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({
      invalid_type_error: "El correo electrónico debe ser una cadena de texto",
      required_error: "El correo electrónico es requerido",
    })
    .email({ message: "El correo electrónico no es válido" }),
  password: z
    .string({
      invalid_type_error: "La contraseña debe ser una cadena de texto",
      required_error: "La contraseña es requerida",
    })
    .min(3, {
      message: "La contraseña debe tener como mínimo 3 caracteres",
    }),
});

export type LoginForm = z.infer<typeof loginSchema>;
