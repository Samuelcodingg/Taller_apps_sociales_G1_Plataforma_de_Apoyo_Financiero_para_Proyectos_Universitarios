import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({
      required_error: "El correo electrónico es requerido",
    })
    .email({ message: "El correo electrónico no es válido" }),
  password: z
    .string({
      required_error: "La contraseña es requerida",
    })
    .min(3, {
      message: "La contraseña debe tener como mínimo 3 caracteres",
    }),
});

export type LoginForm = z.infer<typeof loginSchema>;
