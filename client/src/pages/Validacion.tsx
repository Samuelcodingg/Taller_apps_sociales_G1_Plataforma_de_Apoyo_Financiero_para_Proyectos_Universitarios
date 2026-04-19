import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileCheck2, Sparkles, ShieldCheck, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

type State = "idle" | "uploading" | "processing" | "ok" | "fail";

const Validacion = () => {
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);

  const startUpload = () => {
    setState("uploading");
    setProgress(0);
    const tick = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(tick);
          setState("processing");
          setTimeout(() => setState(Math.random() > 0.15 ? "ok" : "fail"), 1800);
          return 100;
        }
        return p + 10;
      });
    }, 120);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Badge className="bg-accent text-accent-foreground hover:bg-accent">Paso 2 de 2</Badge>
          <h1 className="text-3xl font-bold mt-2">Valida tu matrícula</h1>
          <p className="text-muted-foreground">Sube tu carnet o constancia. Nuestro sistema de IA verificará tus datos automáticamente.</p>
        </div>

        <Card className="p-6">
          {state === "idle" && (
            <div className="border-2 border-dashed rounded-2xl p-10 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-accent grid place-items-center mx-auto">
                <Upload className="h-7 w-7 text-secondary" />
              </div>
              <div>
                <p className="font-semibold">Arrastra tu documento aquí</p>
                <p className="text-xs text-muted-foreground">PDF, JPG o PNG · máx. 10MB</p>
              </div>
              <Button onClick={startUpload} className="bg-gradient-warm shadow-warm">Seleccionar archivo</Button>
            </div>
          )}

          {state === "uploading" && (
            <div className="space-y-3 py-6">
              <div className="flex items-center gap-3"><Upload className="h-5 w-5 text-primary" /><span className="font-medium">Subiendo documento...</span></div>
              <Progress value={progress} />
            </div>
          )}

          {state === "processing" && (
            <div className="text-center py-10 space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-warm grid place-items-center mx-auto animate-pulse">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <p className="font-semibold">Analizando con IA (OCR)…</p>
              <p className="text-sm text-muted-foreground">Extrayendo nombre, universidad y vigencia</p>
            </div>
          )}

          {state === "ok" && (
            <div className="text-center py-8 space-y-4">
              <ShieldCheck className="h-14 w-14 text-secondary mx-auto" />
              <div>
                <h3 className="text-xl font-semibold">¡Cuenta verificada!</h3>
                <p className="text-sm text-muted-foreground">Datos validados correctamente.</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-left text-sm space-y-1.5">
                <div><span className="text-muted-foreground">Nombre:</span> María Fernández</div>
                <div><span className="text-muted-foreground">Universidad:</span> Universidad Nacional</div>
                <div><span className="text-muted-foreground">Vigencia:</span> 2025-1 ✓</div>
              </div>
              <Button asChild className="w-full bg-gradient-warm shadow-warm">
                <Link to="/perfil"><FileCheck2 className="h-4 w-4 mr-2" />Ir a mi perfil</Link>
              </Button>
            </div>
          )}

          {state === "fail" && (
            <div className="text-center py-8 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive grid place-items-center mx-auto">
                <RefreshCw className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">No pudimos validar el documento</h3>
                <p className="text-sm text-muted-foreground">El nombre no coincide con tu registro. Intenta nuevamente.</p>
              </div>
              <Button onClick={() => setState("idle")} variant="outline">Reintentar</Button>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default Validacion;
