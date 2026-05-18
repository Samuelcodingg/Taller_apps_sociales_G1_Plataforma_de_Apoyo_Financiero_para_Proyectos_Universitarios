import { useState } from "react";
import { useRegisterUserMutation } from "@/slices/apiSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import { TabsContent } from "@radix-ui/react-tabs";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, GraduationCap, Heart, Loader2 } from "lucide-react";
import { RegisterForm, registerSchema } from "@/schemas/registerSchema";
import { AccountType } from "@/types/user";
import GoogleIcon from "@/components/icons/GoogleIcon";

type RegisterProps = {
  value: string;
};

const Register = ({ value }: RegisterProps) => {
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState<AccountType>("creator");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [registerUser, { isLoading }] = useRegisterUserMutation();

  const onSubmit: SubmitHandler<RegisterForm> = async (data) => {
    try {
      const payload = {
        ...data,
        role: accountType,
      };

      console.log(payload);

      // await registerUser(payload).unwrap();

      toast.success("Registro exitoso");

      // navigate("/dashboard");
    } catch (error) {
      console.error("Error: ", error);

      setError("root", {
        message: error?.data?.message || "Ocurrió un error al registrarse",
      });
    }
  };

  return (
    <TabsContent value={value} className="mt-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* TIPO DE CUENTA */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Tipo de cuenta</p>

          <div className="grid grid-cols-2 gap-3">
            {/* ESTUDIANTE */}
            <button
              type="button"
              onClick={() => setAccountType("creator")}
              disabled={isLoading}
              className={`rounded-xl border p-4 text-left transition-all
              ${
                accountType === "creator"
                  ? "border-green-500 bg-green-50"
                  : "border-border hover:border-green-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <GraduationCap
                  className={`h-5 w-5 mt-0.5
                  ${
                    accountType === "creator"
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                />

                <div>
                  <h3 className="font-medium">Estudiante</h3>

                  <p className="text-xs text-muted-foreground mt-1">
                    Crea proyectos
                  </p>
                </div>
              </div>
            </button>

            {/* DONANTE */}
            <button
              type="button"
              onClick={() => setAccountType("donor")}
              disabled={isLoading}
              className={`rounded-xl border p-4 text-left transition-all
              ${
                accountType === "donor"
                  ? "border-orange-500 bg-orange-50"
                  : "border-border hover:border-orange-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <Heart
                  className={`h-5 w-5 mt-0.5
                  ${
                    accountType === "donor"
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                />

                <div>
                  <h3 className="font-medium">Donante</h3>

                  <p className="text-xs text-muted-foreground mt-1">
                    Apoya proyectos
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* INPUTS DINÁMICOS */}
        {accountType === "creator" ? (
          <>
            {/* EMAIL UNIVERSITARIO */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo universitario</Label>

              <Input
                id="email"
                type="email"
                placeholder="tu.correo@unmsm.edu.pe"
                disabled={isLoading}
                {...register("email")}
              />

              <p className="text-xs text-muted-foreground">
                Debe pertenecer a un dominio institucional
              </p>

              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* NOMBRE */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombres</Label>

              <Input
                id="name"
                type="text"
                disabled={isLoading}
                placeholder="Ingresa tus nombres"
                {...register("name")}
              />

              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>

              <Input
                id="email"
                type="email"
                placeholder="tu.correo@gmail.com"
                disabled={isLoading}
                {...register("email")}
              />

              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </>
        )}

        {/* PASSWORD */}
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>

          <Input
            id="password"
            type="password"
            disabled={isLoading}
            placeholder="Ingresa tu contraseña"
            {...register("password")}
          />

          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirme Contraseña</Label>

          <Input
            id="confirmPassword"
            type="password"
            disabled={isLoading}
            placeholder="Confirme tu contraseña"
            {...register("confirmPassword")}
          />

          {errors.confirmPassword && (
            <p className="text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* ERROR GENERAL */}
        {errors.root && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />

            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

        {/* BOTÓN PRINCIPAL (SIN GOOGLE)*/}
        {/* <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creando cuenta...
            </>
          ) : accountType === "creator" ? (
            "Crear cuenta y validar matrícula"
          ) : (
            "Crear cuenta"
          )}
        </Button> */}

        {/* BOTÓN PRINCIPAL (CON GOOGLE) */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creando cuenta...
            </>
          ) : accountType === "creator" ? (
            "Crear cuenta y validar matrícula"
          ) : (
            "Crear cuenta"
          )}
        </Button>

        {/* DIVISOR */}
        <div className="flex items-center justify-center gap-3">
          <hr className="w-full" />
          <span className="text-sm text-muted-foreground">o</span>
          <hr className="w-full" />
        </div>

        {/* GOOGLE */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isLoading}
          onClick={() => {
            toast.success("Conectado con Google");

            // Aquí luego iría el auth real
            // signInWithGoogle()

            // navigate("/dashboard");
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <GoogleIcon />

              {accountType === "creator"
                ? "Continuar con Google y validar matrícula"
                : "Continuar con Google"}
            </>
          )}
        </Button>
      </form>
    </TabsContent>
  );
};

export default Register;
