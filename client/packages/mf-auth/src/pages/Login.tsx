import { Alert, AlertDescription } from "@/components/ui/alert";
import { TabsContent } from "@radix-ui/react-tabs";
import { AlertCircle, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginForm, loginSchema } from "@/schemas/loginSchema";
import { useLoginUserMutation } from "@/slices/apiSlice";
import { toast } from "sonner";
import GoogleIcon from "@/components/icons/GoogleIcon";
import { LoginRequest } from "@/types/auth";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { AppDispatch } from "@/store/store";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/slices/authSlice";

type LoginProps = {
  value: string;
};

const Login = ({ value }: LoginProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    // setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const navigate = useNavigate();
  const [loginUser, { data, isLoading, isError, error }] =
    useLoginUserMutation();
  const dispatch = useDispatch<AppDispatch>();

  const onSubmit: SubmitHandler<LoginForm> = async (data: LoginRequest) => {
    try {
      console.log("Datos a enviar: ", data);

      const response = await loginUser(data).unwrap();
      console.log("Response: ", response);

      dispatch(
        setCredentials({
          user: response.user,
          accessToken: response.accessToken,
        }),
      );

      localStorage.setItem("refreshToken", response.refreshToken);

      toast.success("Inicio de sesión exitoso");

      navigate("/");
    } catch (error) {
      console.error("Error: ", error);

      // Colocar esto o sino un toast.error
      toast.error(getErrorMessage(error));
    } finally {
      reset();
    }
  };

  return (
    <TabsContent value={value} className="space-y-4 mt-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu.correo@ejemplo.com"
            disabled={isLoading}
            {...register("email")}
            required
          />
        </div>
        {errors.email && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.email.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <p className="text-[13px] text-black-500 cursor-pointer">
              ¿Olvidaste tu contraseña?
            </p>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Ingresa tu contraseña"
            disabled={isLoading}
            {...register("password")}
            required
          />

          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* ERROR GENERAL */}
        {/* {errors.root && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )} */}

        {/* BOTÓN DE ENVÍO */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>

        <div className="flex items-center justify-center gap-3">
          <hr className="w-full" />
          <span className="text-sm">o</span>
          <hr className="w-full" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            toast.success("Conectado con Google");
            navigate("/profile");
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            <>
              <GoogleIcon />
              Continuar con Google
            </>
          )}
        </Button>
      </form>
    </TabsContent>
  );
};

export default Login;
