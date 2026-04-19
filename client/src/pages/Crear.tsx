import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, Save, Send, X } from "lucide-react";
import { toast } from "sonner";

const Crear = () => {
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [analyzed, setAnalyzed] = useState(false);

  const analyze = () => {
    if (desc.trim().length < 20) {
      toast.error("Escribe una descripción más completa");
      return;
    }
    const pool = ["Educación", "Tecnología", "Sostenibilidad", "Cultura", "Comunidad", "Salud"];
    const picked = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    setTags(picked);
    setAnalyzed(true);
    toast.success("Categorías sugeridas por IA");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Crear nueva campaña</h1>
          <p className="text-muted-foreground">Cuenta tu idea. Puedes guardar como borrador y editar luego.</p>
        </div>

        <Card className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Título del proyecto</Label>
            <Input placeholder="Ej. Huerto urbano universitario" />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea rows={6} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Cuenta de qué trata, a quién impacta y cómo se usarán los fondos." />
          </div>

          <div className="rounded-xl border bg-accent/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" /> Categorización automática (NLP)
              </div>
              <Button type="button" size="sm" variant="outline" onClick={analyze}>Analizar</Button>
            </div>
            {analyzed ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Badge key={t} className="bg-card text-foreground hover:bg-card border">
                    {t}
                    <button className="ml-1 opacity-60 hover:opacity-100" onClick={() => setTags(tags.filter((x) => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button size="sm" variant="ghost" className="h-6">+ Agregar</Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Te sugeriremos 1-3 categorías a partir de la descripción.</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Meta económica (S/)</Label>
              <Input type="number" placeholder="5000" />
            </div>
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imágenes / video</Label>
            <div className="border-2 border-dashed rounded-xl p-8 text-center text-sm text-muted-foreground">
              <Upload className="h-6 w-6 mx-auto mb-2" />
              Arrastra archivos o haz clic para subir
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => toast.success("Borrador guardado")}>
              <Save className="h-4 w-4 mr-2" />Guardar borrador
            </Button>
            <Button className="bg-gradient-warm shadow-warm" onClick={() => toast.success("Campaña publicada")}>
              <Send className="h-4 w-4 mr-2" />Publicar
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Crear;
