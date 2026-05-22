import { useEffect, useState } from "react";
import { useRegisterDonorMutation } from "@/slices/apiSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import { TabsContent } from "@radix-ui/react-tabs";
import { SubmitHandler, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, GraduationCap, Heart, Loader2 } from "lucide-react";
import { RegisterForm, registerSchema } from "@/schemas/registerSchema";
import { AccountType } from "@/types/user";
import GoogleIcon from "@/components/icons/GoogleIcon";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { RegisterCreatorRequest, RegisterDonorRequest } from "@/types/auth";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { setCredentials } from "@/slices/authSlice";
import { getErrorMessage } from "@/lib/getErrorMessage";

type RegisterProps = {
  value: string;
};

const Register = ({ value }: RegisterProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    reset,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: ACCOUNT_TYPES[0],
      names: "",
      lastNames: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const [registerDonor, { isLoading }] = useRegisterDonorMutation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const [accountType, setAccountType] = useState<AccountType>(ACCOUNT_TYPES[0]);

  const formData = location.state?.formData as RegisterForm | undefined;

  const onSubmit: SubmitHandler<RegisterForm> = async (data) => {
    try {
      if (data.accountType === ACCOUNT_TYPES[0]) {
        const creatorData: Omit<RegisterCreatorRequest, "document" | "names"> =
          {
            accountType: data.accountType,
            email: data.email,
            password: data.password,
          };

        navigate("/auth/validation", {
          state: { creatorData },
        });
        return;
      }

      const donorData: RegisterDonorRequest = {
        accountType: data.accountType,
        names: data.names,
        lastNames: data.lastNames,
        email: data.email,
        password: data.password,
      };

      const response = await registerDonor(donorData).unwrap();

      console.log("Respuesta: ", response);

      dispatch(
        setCredentials({
          user: response.user,
          accessToken: response.accessToken,
        }),
      );

      localStorage.setItem("refreshToken", response.refreshToken);

      toast.success("Registro exitoso");

      navigate("/profile");
    } catch (error) {
      console.error("Error: ", error);

      // Colocar esto o sino un toast.error
      toast.error(getErrorMessage(error));
    } finally {
      reset();
    }
  };

  const selectAccountType = (type: AccountType) => {
    setAccountType(type);
    setValue("accountType", type);
  };

  useEffect(() => {
    if (!formData) return;

    setAccountType(formData.accountType);
    setValue("accountType", formData.accountType);
    setValue("names", formData.names ?? "");
    setValue("lastNames", formData.lastNames ?? "");
    setValue("email", formData.email);
    setValue("password", formData.password);
    setValue("confirmPassword", formData.confirmPassword);
  }, [formData, setValue]);

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
              onClick={() => selectAccountType(ACCOUNT_TYPES[0])}
              disabled={isLoading}
              className={`rounded-xl border p-4 text-left transition-all
              ${
                accountType === ACCOUNT_TYPES[0]
                  ? "border-green-500 bg-green-50"
                  : "border-border hover:border-green-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <GraduationCap
                  className={`h-5 w-5 mt-0.5
                  ${
                    accountType === ACCOUNT_TYPES[0]
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
              onClick={() => selectAccountType(ACCOUNT_TYPES[1])}
              disabled={isLoading}
              className={`rounded-xl border p-4 text-left transition-all
              ${
                accountType === ACCOUNT_TYPES[1]
                  ? "border-orange-500 bg-orange-50"
                  : "border-border hover:border-orange-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <Heart
                  className={`h-5 w-5 mt-0.5
                  ${
                    accountType === ACCOUNT_TYPES[1]
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

        {/* NOMBRE */}
        {accountType === ACCOUNT_TYPES[1] && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Nombres</Label>

              <Input
                id="name"
                type="text"
                disabled={isLoading}
                placeholder="Ingresa tus nombres"
                {...register("names")}
              />

              {errors.names && (
                <p className="text-sm text-red-500">{errors.names.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastNames">Apellidos</Label>

              <Input
                id="lastNames"
                type="text"
                disabled={isLoading}
                placeholder="Ingresa tus apellidos"
                {...register("lastNames")}
              />

              {errors.lastNames && (
                <p className="text-sm text-red-500">
                  {errors.lastNames.message}
                </p>
              )}
            </div>
          </>
        )}

        {/* CORREO - CORREO UNIVERSITARIO */}
        <div className="space-y-2">
          <Label htmlFor="email">
            {accountType === ACCOUNT_TYPES[0]
              ? "Correo universitario"
              : "Correo"}
          </Label>

          <Input
            id="email"
            type="email"
            placeholder={
              accountType === ACCOUNT_TYPES[0]
                ? "tu.correo@unmsm.edu.pe"
                : "tu.correo@gmail.com"
            }
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

        {/* BOTÓN PRINCIPAL (CON GOOGLE) */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creando cuenta...
            </>
          ) : accountType === ACCOUNT_TYPES[0] ? (
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

        {/* Cambiar el isLoading por otro que sea propio del Registro con Google */}
        {/* GOOGLE */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isLoading}
          onClick={() => {
            toast.success("Conectado con Google");
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

              {accountType === ACCOUNT_TYPES[0]
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
