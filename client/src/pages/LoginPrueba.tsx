import { AppLayout } from "@/components/AppLayout";
import { LoginForm, loginSchema } from "@/schemas/loginSchema";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthProvider";

const LoginPrueba = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { login } = useAuth();

  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    const { email, password } = data;

    try {
      console.log("Se enviarán los datos: ", data);

      await login({ email, password });
    } catch (error) {
      console.error("Ocurrió un error al iniciar sesión");
      alert("Ocurrió un problema al iniciar sesión ...");
    } finally {
      reset();
    }
  };

  return (
    <AppLayout>
      <div>INICIA SESIÓN</div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="email">Correo: </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Correo"
          {...register("email")}
        />
        {errors.email && <p>{errors.email.message}</p>}

        <label htmlFor="password">Contraseña: </label>
        <input
          type="password"
          name="password"
          id="password"
          placeholder="Contraseña"
          {...register("password")}
        />
        {errors.password && <p>{errors.password.message}</p>}

        <button className="border border-black px-2 py-1 cursor-pointer">
          Enviar
        </button>
      </form>
    </AppLayout>
  );
};

export default LoginPrueba;
