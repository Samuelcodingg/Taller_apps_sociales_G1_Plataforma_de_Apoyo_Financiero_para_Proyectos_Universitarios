import { ChangeEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, Send, X, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useCreateCampaignMutation } from "@/slices/apiSlice";
import { getErrorMessage } from "@/lib/getErrorMessage";

const Crear = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [createCampaign, { isLoading }] = useCreateCampaignMutation();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [analyzed, setAnalyzed] = useState(false);

  const analyze = () => {
    if (desc.trim().length < 20) {
      toast.error("Escribe una descripción más completa");
      return;
    }
    const pool = ["Educación", "Tecnología", "Medio Ambiente", "Cultura", "Comunidad", "Salud"];
    const picked = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    setTags(picked);
    setAnalyzed(true);
    toast.success("Categorías sugeridas (la versión final la asigna el servidor)");
  };

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/") && !selected.type.startsWith("video/")) {
      toast.error("Solo se permiten imágenes o videos");
      return;
    }
    setFile(selected);
  };

  const submit = async (status: "DRAFT" | "ACTIVE") => {
    if (!file) {
      toast.error("Adjunta una imagen o video de la campaña");
      return;
    }
    try {
      const campaign = await createCampaign({
        title,
        description: desc,
        goalAmount: Number(goal),
        endDate: deadline,
        media: file,
        status,
      }).unwrap();

      toast.success(status === "DRAFT" ? "Borrador guardado" : "¡Campaña publicada!");
      navigate(`/campana/${campaign.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Crear nueva campaña</h1>
          <p className="text-muted-foreground">Cuenta tu idea y publícala para empezar a recibir apoyo.</p>
        </div>

        <Card className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Título del proyecto</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Huerto urbano universitario" />
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
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">El servidor asignará 1-3 categorías a partir de tu descripción al publicar.</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Meta económica (S/)</Label>
              <Input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="5000" />
            </div>
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagen / video</Label>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={onPickFile} />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-8 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary/50"
            >
              <Upload className="h-6 w-6 mx-auto mb-2" />
              {file ? file.name : "Haz clic para subir una imagen o video"}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => submit("DRAFT")} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Guardar borrador
            </Button>
            <Button className="bg-gradient-warm shadow-warm" onClick={() => submit("ACTIVE")} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Crear;
