import { Loader2 } from "lucide-react";

const AuthLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>

        <div className="text-center">
          <h2 className="font-semibold text-lg">Cargando plataforma</h2>

          <p className="text-sm text-muted-foreground">
            Preparando tu experiencia...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLoading;
