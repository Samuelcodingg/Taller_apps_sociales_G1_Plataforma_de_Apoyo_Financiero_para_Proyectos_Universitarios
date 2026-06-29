import { ChangeEvent, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileCheck2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useRegisterCreatorMutation } from "@/slices/apiSlice";
import { RegisterCreatorRequest } from "@/types/auth";
import { setCredentials } from "@/slices/authSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { getErrorMessage } from "@/lib/getErrorMessage";

const Validation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const creatorData = location.state?.creatorData as
    | Omit<RegisterCreatorRequest, "document">
    | undefined;

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Limite de tamano del PDF. API Gateway/Lambda rechaza payloads grandes con
  // 413 (y esa respuesta no lleva cabecera CORS, lo que confunde con un error de
  // CORS). Un reporte de matricula real pesa muy poco; topamos en 4 MB.
  const MAX_PDF_BYTES = 4 * 1024 * 1024;

  const [registerCreator, { isLoading }] = useRegisterCreatorMutation();

  const startFileSelection = () => {
    fileInputRef.current?.click();
  };

  const backToRegister = () => {
    navigate("/auth", {
      state: {
        formData: creatorData,
      },
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    if (selected.type !== "application/pdf") {
      setError("Solo se permite PDF");
      return;
    }

    if (selected.size > MAX_PDF_BYTES) {
      setFile(null);
      setError(
        `El PDF es demasiado grande (${(selected.size / (1024 * 1024)).toFixed(
          1,
        )} MB). El máximo permitido es 4 MB. Sube el reporte de matrícula original (suele pesar menos de 1 MB).`,
      );
      return;
    }

    console.log("Hasta antes del envío se tienen estos datos: ", {
      ...creatorData,
      document: selected,
    });

    setFile(selected);
    setError(null);
  };

  const handleRegister = async () => {
    if (!creatorData || !file) {
      setError("Falta información o archivo PDF");
      return;
    }

    try {
      setError(null);

      const response = await registerCreator({
        ...creatorData,
        document: file,
      }).unwrap();

      dispatch(
        setCredentials({
          user: response.user,
          accessToken: response.accessToken,
        }),
      );

      console.log("Se enviaron estos datos: ", {
        ...creatorData,
        document: file,
      });

      localStorage.setItem("refreshToken", response.refreshToken);

      toast.success("Registro completado");

      console.log("Respuesta del back: ", response);

      navigate("/");
    } catch (error) {
      console.error("Error: ", error);

      // 413 / fallo de red: la respuesta no trae data.message (y a veces se ve
      // como error de CORS). Damos una pista sobre el tamano del archivo.
      const status = error?.status;
      const isTooLargeOrNetwork =
        status === 413 || status === "FETCH_ERROR" || status === "PARSING_ERROR";

      const message =
        error?.data?.message ||
        (isTooLargeOrNetwork
          ? "No se pudo enviar el PDF. Puede que el archivo sea demasiado grande (máx. 4 MB) o haya un problema de conexión."
          : "Error al registrar usuario");

      toast.error(message);
      setError(message);
    }
  };

  useEffect(() => {
    if (!creatorData) {
      navigate("/register");
    }
  }, [creatorData, navigate]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Badge className="cursor-pointer" onClick={backToRegister}>
            Volver
          </Badge>

          <h1 className="text-3xl font-bold mt-2">Validación de matrícula</h1>

          <p className="text-muted-foreground">
            Sube tu PDF para completar el registro.
          </p>
        </div>

        <Card className="p-6">
          <div className="border-2 border-dashed rounded-2xl p-10 text-center space-y-4">
            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />

            <p className="font-medium">
              {file ? file.name : "Sube tu PDF de matrícula"}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button onClick={startFileSelection} variant="outline">
              Seleccionar archivo
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <Button
            className="w-full mt-6"
            disabled={isLoading || !file}
            onClick={handleRegister}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Registrando...
              </>
            ) : (
              <>
                <FileCheck2 className="mr-2 h-4 w-4" />
                Completar registro
              </>
            )}
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Validation;
