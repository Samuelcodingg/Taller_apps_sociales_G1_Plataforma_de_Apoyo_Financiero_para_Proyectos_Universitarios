import { ChangeEvent, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Upload,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useRegisterCreatorMutation,
  useValidateStudentDocumentMutation,
} from "@/slices/apiSlice";
import { RegisterForm } from "@/schemas/registerSchema";

type State = "idle" | "uploading" | "ok" | "fail";

const Validacion = () => {
  const [state, setState] = useState<State>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localValidationError, setLocalValidationError] = useState<
    string | null
  >(null);
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formData = location.state?.formData as RegisterForm | undefined;

  const [validateDocument, { data: validationData, error: validationError }] =
    useValidateStudentDocumentMutation();
  const [registerCreator, { isLoading }] = useRegisterCreatorMutation();

  const startFileSelection = () => {
    fileInputRef.current?.click();
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const base64 = result.split(",")[1] ?? "";
          resolve(base64);
        } else {
          reject(new Error("No se pudo leer el archivo."));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const validatePdf = async (file: File) => {
    if (!formData) return;

    setState("uploading");
    setLocalValidationError(null);

    const fileBase64 = await readFileAsBase64(file);

    try {
      const result = await validateDocument({
        email: formData.email,
        fileName: file.name,
        documentBase64: fileBase64,
      }).unwrap();

      setState(result.valid ? "ok" : "fail");

      if (!result.valid) {
        setLocalValidationError(
          "El documento no pudo ser validado. Verifica que sea un carnet o constancia válido de la UNMSM.",
        );
      }
    } catch (error) {
      setState("fail");
      const apiError = error as any;
      setLocalValidationError(
        apiError?.data?.message ||
          "Error al validar el documento. Intenta nuevamente.",
      );
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setLocalValidationError("Solo se permite PDF.");
      setState("fail");
      return;
    }

    setSelectedFile(file);
    await validatePdf(file);
  };

  const backToRegister = () => navigate("/auth", { state: { formData } });

  const handleRegister = async () => {
    if (!formData || !validationData || !validationData.valid) {
      return;
    }

    try {
      // Envío de datos del Estudiante para su Registro -> Colocar en el type los datos exactos que se enviarán
      // await registerCreator({
      //   ...formData,
      //   extractedName: validationData.extractedName,
      //   extractedUniversity: validationData.extractedUniversity,
      //   documentValidation: validationData,
      // }).unwrap();

      toast.success("Registro completado");
      navigate("/perfil");
    } catch (error) {
      console.error("Error al registrar después de validación:", error);
      toast.error(
        error?.data?.message || "Ocurrió un error al registrar la cuenta",
      );
    }
  };

  useEffect(() => {
    if (!formData) {
      navigate("/register");
    }
  }, [formData, navigate]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Badge
            className="bg-accent text-accent-foreground hover:bg-accent cursor-pointer"
            onClick={backToRegister}
          >
            Volver
          </Badge>
          <h1 className="text-3xl font-bold mt-2">Valida tu matrícula</h1>
          <p className="text-muted-foreground">
            Sube tu reporte de matrícula. Nuestro sistema de IA verificará tus
            datos automáticamente.
          </p>
        </div>

        <Card className="p-6">
          {/* Inicial */}
          {state === "idle" && (
            <div className="border-2 border-dashed rounded-2xl p-10 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-accent grid place-items-center mx-auto">
                <Upload className="h-7 w-7 text-secondary" />
              </div>
              <div>
                <p className="font-semibold">Arrastra tu documento aquí</p>
                <p className="text-xs text-muted-foreground">PDF · máx. 10MB</p>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Archivo seleccionado: {selectedFile.name}
                  </p>
                )}
              </div>
              <Button
                onClick={startFileSelection}
                className="bg-gradient-warm shadow-warm"
              >
                Seleccionar archivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {state === "uploading" && (
            <div className="text-center py-10 space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-warm grid place-items-center mx-auto animate-pulse">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <p className="font-semibold">Validando documento...</p>
              <p className="text-sm text-muted-foreground">
                Esperando la respuesta del servidor. Esto depende del tiempo
                real del backend.
              </p>
            </div>
          )}

          {state === "ok" && (
            <div className="text-center py-8 space-y-4">
              <ShieldCheck className="h-14 w-14 text-secondary mx-auto" />
              <div>
                <h3 className="text-xl font-semibold">¡Cuenta verificada!</h3>
                <p className="text-sm text-muted-foreground">
                  Datos validados correctamente.
                </p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-left text-sm space-y-1.5">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>{" "}
                  {validationData?.extractedName || "Usuario"}
                </div>
                <div>
                  <span className="text-muted-foreground">Universidad:</span>{" "}
                  {validationData?.extractedUniversity || "UNMSM"}
                </div>
                <div>
                  <span className="text-muted-foreground">Vigencia:</span>{" "}
                  {validationData?.isUnmsm ? "2026-1 ✓" : "No verificado"}
                </div>
              </div>
              <Button
                onClick={handleRegister}
                className="w-full bg-gradient-warm shadow-warm"
                disabled={isLoading}
              >
                <FileCheck2 className="h-4 w-4 mr-2" />
                Registrarse
              </Button>
            </div>
          )}

          {state === "fail" && (
            <div className="text-center py-8 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive grid place-items-center mx-auto">
                <RefreshCw className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  No pudimos validar el documento
                </h3>
                <p className="text-sm text-muted-foreground">
                  {localValidationError ||
                    (validationError as any)?.data?.message ||
                    "El documento no coincide con tu registro. Intenta nuevamente."}
                </p>
              </div>
              <Button
                onClick={() => {
                  setState("idle");
                  setLocalValidationError(null);
                  setSelectedFile(null);
                }}
                variant="outline"
              >
                Reintentar
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default Validacion;
