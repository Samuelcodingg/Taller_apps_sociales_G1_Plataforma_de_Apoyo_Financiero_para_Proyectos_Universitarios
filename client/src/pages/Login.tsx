import { Alert, AlertDescription } from "@/components/ui/alert";
import { TabsContent } from "@radix-ui/react-tabs";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginForm, loginSchema } from "@/schemas/loginSchema";
import { useLoginUserMutation } from "@/slices/apiSlice";
import { toast } from "sonner";
import GoogleIcon from "@/components/icons/GoogleIcon";

type LoginProps = {
  value: string;
};

const Login = ({ value }: LoginProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
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

  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    try {
      console.log("Datos a enviar: ", data);

      // const response = await loginUser(data).unwrap();
      // console.log("Response: ", response);

      toast.success("Inicio de sesión exitoso");

      // navigate("/dashboard");
    } catch (error) {
      console.error("Error: ", error);

      // Colocar esto o sino un toast.error
      setError("root", {
        message: error?.data?.message || "Correo o contraseña incorrectos",
      });
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
            placeholder="tu.nombre@uni.edu.pe"
            disabled={isLoading}
            {...register("email")}
            required
          />
          {/* <p className="text-xs text-muted-foreground">
            Validamos que pertenezcas a una institución reconocida.
          </p> */}
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
          {/* <p className="text-xs text-muted-foreground">
            Validamos que pertenezcas a una institución reconocida.
          </p> */}
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* ERROR GENERAL */}
        {errors.root && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

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
            navigate("/perfil");
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
