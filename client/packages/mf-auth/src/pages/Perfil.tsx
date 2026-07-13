import { useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Linkedin, Globe, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getInitialsNames } from "@/lib/utils";
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} from "@/slices/apiSlice";
import { getErrorMessage } from "@/lib/getErrorMessage";

// Plataformas tal como las guarda el back en social_network.
const LINKEDIN = "LINKEDIN";
const PORTFOLIO = "PORTFOLIO";

const Perfil = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  // Solo los creadores (estudiantes) tienen datos academicos y verificacion de
  // matricula. Los donantes no son estudiantes: no se les muestra esa seccion.
  const isCreator = user?.role === "CREATOR";
  // Trae el perfil real desde el back. Los datos del registro (Redux) sirven de
  // respaldo inmediato mientras carga o si el endpoint no responde.
  const { data: profile } = useGetMyProfileQuery();
  const [updateMyProfile, { isLoading: isSaving }] =
    useUpdateMyProfileMutation();

  // Campos editables (estado local del formulario).
  const [names, setNames] = useState("");
  const [lastNames, setLastNames] = useState("");
  const [biography, setBiography] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [country, setCountry] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [yapeQrUrl, setYapeQrUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const yapeInputRef = useRef<HTMLInputElement | null>(null);

  // Campos de solo lectura. Universidad y escuela vienen del reporte de matricula.
  const university = profile?.university || profile?.institution?.name || user?.university || "";
  const school = profile?.school || "";

  // Inicializa el formulario cuando llega el perfil del back (o el user de Redux).
  useEffect(() => {
    setNames(profile?.names || user?.names || "");
    setLastNames(profile?.surnames || user?.lastNames || "");
    setBiography(profile?.biography || "");
    setBirthDate(profile?.birthDate || user?.birthDate || "");
    setCountry(profile?.country?.name || user?.country || "");
    setPhotoUrl(profile?.photoUrl ?? null);
    setYapeQrUrl(profile?.yapeQrUrl ?? null);
    const networks = profile?.socialNetworks ?? [];
    setLinkedin(networks.find((n) => n.platform === LINKEDIN)?.link || "");
    setPortfolio(networks.find((n) => n.platform === PORTFOLIO)?.link || "");
  }, [profile, user]);

  // Lee la imagen elegida, la redimensiona a ~256px y la guarda como data URL
  // (se persiste en photo_url). Evita subir archivos pesados.
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // Recorte cuadrado centrado.
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        setPhotoUrl(canvas.toDataURL("image/jpeg", 0.85));
        toast.success("Foto lista. Guarda los cambios para aplicarla.");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Lee el QR de Yape, lo redimensiona a máx 512px (conservando proporción para
  // que siga siendo legible/escaneable) y lo guarda como data URL.
  const handleYapeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida del QR");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 512;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        setYapeQrUrl(canvas.toDataURL("image/jpeg", 0.9));
        toast.success("QR listo. Guarda los cambios para aplicarlo.");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Solo enviamos las redes con valor para no crear entradas vacias.
    const socialNetworks = [
      { platform: LINKEDIN, link: linkedin.trim() },
      { platform: PORTFOLIO, link: portfolio.trim() },
    ].filter((n) => n.link.length > 0);

    try {
      await updateMyProfile({
        names: names.trim(),
        surnames: lastNames.trim(),
        biography: biography.trim() || null,
        birthDate: birthDate || null,
        country: country.trim() || null,
        photoUrl: photoUrl ?? null,
        yapeQrUrl: yapeQrUrl ?? null,
        socialNetworks,
      }).unwrap();

      toast.success("Perfil actualizado");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-warm" />
          <div className="p-6 -mt-12">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-card">
                  {photoUrl && <AvatarImage src={photoUrl} alt="Foto de perfil" />}
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                    {getInitialsNames(names, lastNames)}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-card border grid place-items-center hover:bg-muted"
                  title="Cambiar foto"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">
                    {names || "N/A"} {lastNames || ""}
                  </h1>
                  {isCreator ? (
                    <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Donante</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isCreator
                    ? `${university || "N/A"} · ${school || "N/A"}`
                    : "Donante"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="font-semibold text-lg">Editar perfil</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombres</Label>
                <Input
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                  placeholder="Tus nombres"
                />
              </div>
              <div className="space-y-2">
                <Label>Apellidos</Label>
                <Input
                  value={lastNames}
                  onChange={(e) => setLastNames(e.target.value)}
                  placeholder="Tus apellidos"
                />
              </div>
            </div>
            {isCreator && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Centro de estudios</Label>
                  <Input value={university || "N/A"} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Escuela</Label>
                  <Input value={school || "N/A"} readOnly />
                </div>
              </div>
            )}

            {isCreator && (
              <div className="space-y-2 rounded-xl border p-4">
                <Label>QR de Yape (para recibir donaciones)</Label>
                <p className="text-xs text-muted-foreground">
                  Sube la imagen de tu código QR de Yape. Los donadores lo verán al elegir
                  "Donar con Yape" y tú confirmarás el pago desde Mi panel.
                </p>
                <div className="flex items-center gap-4">
                  {yapeQrUrl ? (
                    <img
                      src={yapeQrUrl}
                      alt="QR de Yape"
                      className="h-28 w-28 rounded-lg object-contain border bg-white"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-lg border grid place-items-center text-xs text-muted-foreground">
                      Sin QR
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={yapeInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleYapeChange}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => yapeInputRef.current?.click()}>
                      {yapeQrUrl ? "Cambiar QR" : "Subir QR"}
                    </Button>
                    {yapeQrUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setYapeQrUrl(null)}>
                        Quitar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input value={user?.email ?? ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={birthDate ? birthDate.slice(0, 10) : ""}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>País</Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Tu país"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Biografía</Label>
              <Textarea
                rows={4}
                placeholder="Háblanos sobre ti."
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input
                  placeholder="linkedin.com/in/..."
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Portafolio
                </Label>
                <Input
                  placeholder="https://..."
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-warm shadow-warm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Perfil;
