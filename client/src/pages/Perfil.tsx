import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Linkedin, Globe, Camera } from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getInitialsNames } from "@/lib/utils";

const Perfil = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-warm" />
          <div className="p-6 -mt-12">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-card">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                    {getInitialsNames(user.names, user.lastNames)}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-card border grid place-items-center hover:bg-muted">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">
                    {user.names ?? "John"} {user.lastNames ?? "Doe"}
                  </h1>
                  <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {user.university ?? "N/A"} · {user.major ?? "N/A"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <h2 className="font-semibold text-lg">Editar perfil</h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Perfil actualizado");
            }}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombres</Label>
                <Input value={user.names ?? "John"} />
              </div>
              <div className="space-y-2">
                <Label>Apellidos</Label>
                <Input value={user.lastNames ?? "Doe"} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Centro de estudios</Label>
                <Input value={user.university ? user.university : "N/A"} />
              </div>
              <div className="space-y-2">
                <Label>Carrera</Label>
                <Input value={user.major ? user.major : "N/A"} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input value={user.email} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de nacimiento</Label>
                <Input
                  value={
                    user.birthDate
                      ? new Date(user.birthDate).toLocaleDateString()
                      : "N/A"
                  }
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>País</Label>
                <Input value={user.country ? user.country : "N/A"} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Biografía</Label>
              <Textarea rows={4} placeholder="Háblanos sobre ti." />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input placeholder="linkedin.com/in/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Portafolio
                </Label>
                <Input placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-warm shadow-warm">
                Guardar cambios
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Perfil;
