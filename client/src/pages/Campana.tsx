import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Heart, Share2, Users, Calendar, ShieldCheck, MessageCircle, Mail, CreditCard, EyeOff, CheckCircle2, Loader2, Pencil, Megaphone, Send, Bookmark, Bell, Handshake } from "lucide-react";
import { toast } from "sonner";
import {
  useGetCampaignQuery,
  useEditCampaignMutation,
  useAddCampaignUpdateMutation,
  useAddCampaignCommentMutation,
  useInteractCampaignMutation,
  useDonateMutation,
  useConfirmPaymentMutation,
  useRecordViewMutation,
} from "@/slices/apiSlice";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { safeImageUrl } from "@/lib/mapCampaign";

const PLACEHOLDER_IMAGE = "https://placehold.co/1024x576?text=Campa%C3%B1a";

const Campana = () => {
  const { id = "" } = useParams();
  const user = useSelector((state: RootState) => state.auth.user);
  // pollingInterval: refresca cada 4s para que comentarios, actualizaciones y
  // donaciones aparezcan casi en tiempo real sin recargar la pagina.
  const { data: c, isLoading, isError } = useGetCampaignQuery(id, {
    skip: !id,
    pollingInterval: 4000,
  });

  const [editCampaign, { isLoading: isEditing }] = useEditCampaignMutation();
  const [addUpdate, { isLoading: isAddingUpdate }] = useAddCampaignUpdateMutation();
  const [addComment, { isLoading: isCommenting }] = useAddCampaignCommentMutation();
  const [interact] = useInteractCampaignMutation();
  const [donateMut, { isLoading: isDonating }] = useDonateMutation();
  const [confirmPayment] = useConfirmPaymentMutation();
  const [recordView] = useRecordViewMutation();

  const [amount, setAmount] = useState("50");
  const [anon, setAnon] = useState(false);
  const [success, setSuccess] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);

  // Edicion (dueño)
  const [editForm, setEditForm] = useState({ title: "", description: "", goalAmount: "", endDate: "" });
  const [editOpen, setEditOpen] = useState(false);
  // Nueva actualizacion (dueño)
  const [updateForm, setUpdateForm] = useState({ title: "", message: "" });
  const [updateImage, setUpdateImage] = useState<File | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  // Comentario
  const [comment, setComment] = useState("");

  // Registra el clic/vista de la campaña (señal para el feed personalizado).
  useEffect(() => {
    if (id) recordView(id);
  }, [id, recordView]);

  useEffect(() => {
    if (c) {
      setEditForm({
        title: c.title,
        description: c.description,
        goalAmount: String(c.goalAmount),
        endDate: c.endDate.slice(0, 10),
      });
    }
  }, [c]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </AppLayout>
    );
  }

  if (isError || !c) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">
          No encontramos esta campaña. <Link to="/explorar" className="text-primary">Volver al catálogo</Link>
        </div>
      </AppLayout>
    );
  }

  const isOwner = !!user && user.id === c.creator.id;
  const raised = c.currentAmount;
  const goal = c.goalAmount;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const cover = safeImageUrl(c.media[0]?.url) ?? PLACEHOLDER_IMAGE;
  const daysLeft = Math.max(0, Math.ceil((+new Date(c.endDate) - Date.now()) / 86400000));

  const donate = async () => {
    const v = parseInt(amount) || 0;
    if (v <= 0) { toast.error("Monto inválido"); return; }
    try {
      // 1. Registra la donación (pago PENDING en la pasarela).
      const res = await donateMut({ campaignId: c.id, amount: v, isAnonymous: anon }).unwrap();
      // 2. Confirma el pago (simula el retorno del checkout) -> suma al progreso.
      await confirmPayment({ transactionId: res.transactionId }).unwrap();
      setSuccess(true);
      toast.success("¡Gracias por tu donación! Te enviamos el comprobante por correo.");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  // Reinicia el diálogo al abrir/cerrar para permitir volver a donar.
  const onDonateOpenChange = (open: boolean) => {
    setDonateOpen(open);
    if (!open) setSuccess(false);
  };

  const requireLogin = (): boolean => {
    if (!user) { toast.error("Inicia sesión para esta acción"); return false; }
    return true;
  };

  const saveEdit = async () => {
    try {
      await editCampaign({
        id: c.id,
        data: {
          title: editForm.title,
          description: editForm.description,
          goalAmount: Number(editForm.goalAmount),
          endDate: editForm.endDate,
        },
      }).unwrap();
      toast.success("Campaña actualizada");
      setEditOpen(false);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const publishUpdate = async () => {
    try {
      await addUpdate({
        id: c.id,
        title: updateForm.title,
        message: updateForm.message,
        image: updateImage,
      }).unwrap();
      toast.success("Actualización publicada");
      setUpdateForm({ title: "", message: "" });
      setUpdateImage(null);
      setUpdateOpen(false);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const publishDraft = async () => {
    try {
      await editCampaign({ id: c.id, data: { status: "ACTIVE" } }).unwrap();
      toast.success("Campaña publicada");
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const sendComment = async () => {
    if (!requireLogin()) return;
    if (comment.trim().length === 0) return;
    try {
      await addComment({ id: c.id, content: comment }).unwrap();
      setComment("");
      toast.success("Comentario publicado");
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const has = (type: string) => c.myInteractions?.includes(type);

  const react = async (
    type: "LIKE" | "BOOKMARK" | "FOLLOW" | "INTEREST",
    onLabels: { on: string; off: string },
  ) => {
    if (!requireLogin()) return;
    try {
      const r = await interact({ id: c.id, type }).unwrap();
      toast.success(r.active ? onLabels.on : onLabels.off);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const like = () => react("LIKE", { on: "Te gusta esta campaña", off: "Quitaste tu like" });
  const bookmark = () => react("BOOKMARK", { on: "Guardada en favoritos", off: "Quitada de favoritos" });
  const follow = () => react("FOLLOW", { on: "Siguiendo: te avisaremos de sus hitos", off: "Dejaste de seguir" });
  const connect = () => react("INTEREST", { on: "Interés registrado: el creador podrá contactarte", off: "Interés retirado" });

  const share = async (network: string) => {
    if (user) { try { await interact({ id: c.id, type: "SHARE" }).unwrap(); } catch { /* noop */ } }
    toast.success(`Enlace copiado para ${network} (con tracking UTM)`);
  };

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl overflow-hidden">
            <img src={cover} alt={c.title} className="w-full aspect-[16/9] object-cover" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {c.categories.map((cat) => <Badge key={cat} variant="secondary">{cat}</Badge>)}
              {c.status === "DRAFT" && <Badge variant="outline" className="border-amber-500 text-amber-600">Borrador</Badge>}
              {isOwner && (
                <div className="ml-auto flex gap-2">
                  {c.status === "DRAFT" && (
                    <Button size="sm" className="bg-gradient-warm shadow-warm" onClick={publishDraft} disabled={isEditing}>
                      <Send className="h-3.5 w-3.5 mr-1" />Publicar
                    </Button>
                  )}
                  {/* EDITAR (dueño) */}
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5 mr-1" />Editar</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Editar campaña</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1"><Label>Título</Label>
                          <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
                        <div className="space-y-1"><Label>Descripción</Label>
                          <Textarea rows={4} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>Meta (S/)</Label>
                            <Input type="number" value={editForm.goalAmount} onChange={(e) => setEditForm({ ...editForm, goalAmount: e.target.value })} /></div>
                          <div className="space-y-1"><Label>Fecha límite</Label>
                            <Input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} /></div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={saveEdit} disabled={isEditing}>{isEditing ? "Guardando..." : "Guardar cambios"}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {/* NUEVA ACTUALIZACION (dueño) */}
                  <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Megaphone className="h-3.5 w-3.5 mr-1" />Actualización</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Nueva actualización</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1"><Label>Título (opcional)</Label>
                          <Input value={updateForm.title} onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })} /></div>
                        <div className="space-y-1"><Label>Mensaje</Label>
                          <Textarea rows={4} value={updateForm.message} onChange={(e) => setUpdateForm({ ...updateForm, message: e.target.value })} placeholder="Cuenta los avances de tu campaña..." /></div>
                        <div className="space-y-1"><Label>Foto (opcional)</Label>
                          <Input type="file" accept="image/*" onChange={(e) => setUpdateImage(e.target.files?.[0] ?? null)} /></div>
                      </div>
                      <DialogFooter>
                        <Button onClick={publishUpdate} disabled={isAddingUpdate}>{isAddingUpdate ? "Publicando..." : "Publicar"}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{c.title}</h1>
            <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
              <Avatar className="h-8 w-8"><AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{c.creator.name[0]}</AvatarFallback></Avatar>
              <span>{c.creator.name}</span>
              {c.creator.verified && <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary"><ShieldCheck className="h-3 w-3 mr-1" />Verificado</Badge>}
              {c.creator.university && <><span>·</span><span>{c.creator.university}</span></>}
              {c.creator.career && <><span>·</span><span>{c.creator.career}</span></>}
            </div>
          </div>

          <Tabs defaultValue="historia">
            <TabsList>
              <TabsTrigger value="historia">Historia</TabsTrigger>
              <TabsTrigger value="actualizaciones">Actualizaciones ({c.updates.length})</TabsTrigger>
              <TabsTrigger value="comentarios">Comentarios ({c.comments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="historia" className="prose prose-sm max-w-none mt-4 text-foreground">
              <p>{c.description}</p>
            </TabsContent>
            <TabsContent value="actualizaciones" className="space-y-4 mt-4">
              {c.updates.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay actualizaciones.</p>}
              {c.updates.map((u) => (
                <Card key={u.id} className="p-5">
                  <div className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("es-PE")}</div>
                  {u.title && <h3 className="font-semibold mt-1">{u.title}</h3>}
                  {u.message && <p className="text-sm text-muted-foreground mt-2">{u.message}</p>}
                  {u.imageUrl && safeImageUrl(u.imageUrl) === u.imageUrl && (
                    <img src={u.imageUrl} alt="Foto de la actualización" className="mt-3 rounded-lg max-h-80 w-auto object-cover" />
                  )}
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="comentarios" className="space-y-3 mt-4">
              <div className="flex gap-2">
                <Textarea placeholder="Deja un mensaje de aliento..." rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
                <Button onClick={sendComment} disabled={isCommenting}><MessageCircle className="h-4 w-4" /></Button>
              </div>
              {c.comments.length === 0 && <p className="text-sm text-muted-foreground">Sé el primero en comentar.</p>}
              {c.comments.map((cm) => (
                <Card key={cm.id} className="p-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{cm.author[0]}</AvatarFallback></Avatar>
                    <div className="text-sm">
                      <span className="font-medium">{cm.author}</span>
                      <span className="text-muted-foreground"> · {new Date(cm.createdAt).toLocaleDateString("es-PE")}</span>
                    </div>
                  </div>
                  <p className="text-sm mt-2 ml-10">{cm.content}</p>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5 space-y-4">
            <div>
              <div className="text-3xl font-bold text-primary">S/ {raised.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">recaudado de S/ {goal.toLocaleString()}</div>
            </div>
            <Progress value={pct} className="h-3" />
            {/* Hitos: 25 / 50 / 75 / 100 % */}
            <div className="flex items-center justify-between">
              {[25, 50, 75, 100].map((m) => {
                const reached = pct >= m;
                return (
                  <div key={m} className="flex flex-col items-center gap-1">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${reached ? "bg-primary" : "bg-muted-foreground/30"}`}
                    />
                    <span className={`text-[10px] ${reached ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                      {m === 100 ? "Meta" : `${m}%`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{c.donorsCount} donantes</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{daysLeft} días</span>
            </div>

            <Dialog open={donateOpen} onOpenChange={onDonateOpenChange}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-warm shadow-warm" size="lg"><Heart className="h-4 w-4 mr-2" />Donar ahora</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{success ? "¡Donación exitosa!" : "Apoya este proyecto"}</DialogTitle></DialogHeader>
                {success ? (
                  <div className="text-center py-6 space-y-4">
                    <CheckCircle2 className="h-14 w-14 text-secondary mx-auto" />
                    <p className="text-sm text-muted-foreground">Te enviamos el comprobante a tu correo.</p>
                    <div className="bg-muted rounded-lg p-3 text-left text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-secondary" /> Comprobante #DN-{Math.floor(Math.random() * 9999)}</div>
                    <Button variant="outline" className="w-full" onClick={() => setSuccess(false)}>Donar otra vez</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Monto (S/)</Label>
                      <div className="flex gap-2">
                        {[20, 50, 100, 200].map((v) => (
                          <Button key={v} type="button" variant={amount === String(v) ? "default" : "outline"} size="sm" onClick={() => setAmount(String(v))}>S/ {v}</Button>
                        ))}
                      </div>
                      <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="anon" className="flex items-center gap-2 cursor-pointer"><EyeOff className="h-4 w-4" />Donar de forma anónima</Label>
                      <Switch id="anon" checked={anon} onCheckedChange={setAnon} />
                    </div>
                    <div className="rounded-lg border p-3 flex items-center gap-2 text-sm"><CreditCard className="h-4 w-4 text-muted-foreground" /> Pago seguro vía pasarela externa</div>
                    <Button className="w-full bg-gradient-warm shadow-warm" onClick={donate} disabled={isDonating}>
                      {isDonating ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Procesando...</>) : "Confirmar donación"}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Reacciones y favoritos */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant={has("LIKE") ? "default" : "outline"} size="sm" onClick={like}>
                <Heart className="h-3.5 w-3.5 mr-1" />{c.likes} Me gusta
              </Button>
              <Button variant={has("BOOKMARK") ? "default" : "outline"} size="sm" onClick={bookmark}>
                <Bookmark className="h-3.5 w-3.5 mr-1" />Guardar
              </Button>
              <Button variant={has("FOLLOW") ? "default" : "outline"} size="sm" onClick={follow}>
                <Bell className="h-3.5 w-3.5 mr-1" />{has("FOLLOW") ? "Siguiendo" : "Seguir"}
              </Button>
              <Button variant={has("INTEREST") ? "default" : "outline"} size="sm" onClick={connect}>
                <Handshake className="h-3.5 w-3.5 mr-1" />{has("INTEREST") ? "Interesado" : "Conectar"}
              </Button>
            </div>
            <div className="flex gap-2">
              {["WhatsApp", "Facebook", "LinkedIn"].map((n) => (
                <Button key={n} variant="outline" size="sm" className="flex-1" onClick={() => share(n)}><Share2 className="h-3 w-3 mr-1" />{n}</Button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3 text-sm">Donaciones recientes</h3>
            {c.recentDonations.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay donaciones.</p>}
            <ul className="space-y-3">
              {c.recentDonations.map((d, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{d.donor[0]}</AvatarFallback></Avatar>
                    <div>
                      <div className="font-medium">{d.donor}</div>
                      <div className="text-xs text-muted-foreground">{d.timeAgo}</div>
                    </div>
                  </div>
                  <span className="font-semibold text-primary">S/ {d.amount}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Link to="/explorar" className="block text-center text-sm text-muted-foreground hover:text-primary">← Volver al catálogo</Link>
        </aside>
      </div>
    </AppLayout>
  );
};

export default Campana;
