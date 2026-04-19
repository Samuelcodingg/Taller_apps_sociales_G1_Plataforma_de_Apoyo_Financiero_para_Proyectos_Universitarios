import { useState } from "react";
import { useParams, Link } from "react-router-dom";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { campaigns, recentDonations, updates, comments } from "@/lib/mock-data";
import { Heart, Share2, Users, Calendar, ShieldCheck, MessageCircle, Mail, CreditCard, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const Campana = () => {
  const { id } = useParams();
  const c = campaigns.find((x) => x.id === id) ?? campaigns[0];
  const [raised, setRaised] = useState(c.raised);
  const [donors, setDonors] = useState(c.donors);
  const [amount, setAmount] = useState("50");
  const [anon, setAnon] = useState(false);
  const [success, setSuccess] = useState(false);
  const pct = Math.min(100, Math.round((raised / c.goal) * 100));

  const donate = () => {
    const v = parseInt(amount) || 0;
    if (v <= 0) { toast.error("Monto inválido"); return; }
    setRaised(raised + v);
    setDonors(donors + 1);
    setSuccess(true);
    toast.success("¡Gracias por tu donación! Te enviamos el comprobante por correo.");
  };

  const share = (network: string) => {
    toast.success(`Enlace copiado para ${network} (con tracking UTM)`);
  };

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl overflow-hidden">
            <img src={c.image} alt={c.title} width={1024} height={768} className="w-full aspect-[16/9] object-cover" />
          </div>

          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {c.categories.map((cat) => <Badge key={cat} variant="secondary">{cat}</Badge>)}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{c.title}</h1>
            <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
              <Avatar className="h-8 w-8"><AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{c.creator.name[0]}</AvatarFallback></Avatar>
              <span>{c.creator.name}</span>
              {c.creator.verified && <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary"><ShieldCheck className="h-3 w-3 mr-1" />Verificado</Badge>}
              <span>·</span>
              <span>{c.university}</span>
            </div>
          </div>

          <Tabs defaultValue="historia">
            <TabsList>
              <TabsTrigger value="historia">Historia</TabsTrigger>
              <TabsTrigger value="actualizaciones">Actualizaciones ({updates.length})</TabsTrigger>
              <TabsTrigger value="comentarios">Comentarios ({comments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="historia" className="prose prose-sm max-w-none mt-4 text-foreground">
              <p>{c.description}</p>
              <p>Buscamos transformar un espacio en desuso del campus en un punto verde activo, donde los estudiantes puedan aprender sobre agricultura urbana, compostaje y biodiversidad.</p>
              <p>Tu aporte servirá para comprar herramientas, semillas, sistema de riego y materiales educativos.</p>
            </TabsContent>
            <TabsContent value="actualizaciones" className="space-y-4 mt-4">
              {updates.map((u) => (
                <Card key={u.id} className="p-5">
                  <div className="text-xs text-muted-foreground">{u.date}</div>
                  <h3 className="font-semibold mt-1">{u.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{u.body}</p>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="comentarios" className="space-y-3 mt-4">
              <div className="flex gap-2">
                <Textarea placeholder="Deja un mensaje de aliento..." rows={2} />
                <Button onClick={() => toast.success("Comentario publicado")}><MessageCircle className="h-4 w-4" /></Button>
              </div>
              {comments.map((cm) => (
                <Card key={cm.id} className="p-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{cm.author[0]}</AvatarFallback></Avatar>
                    <div className="text-sm">
                      <span className="font-medium">{cm.author}</span>
                      <span className="text-muted-foreground"> · {cm.date}</span>
                    </div>
                  </div>
                  <p className="text-sm mt-2 ml-10">{cm.body}</p>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5 space-y-4">
            <div>
              <div className="text-3xl font-bold text-primary">S/ {raised.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">recaudado de S/ {c.goal.toLocaleString()}</div>
            </div>
            <Progress value={pct} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{donors} donantes</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{Math.max(0, Math.ceil((+new Date(c.deadline) - Date.now()) / 86400000))} días</span>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-warm shadow-warm" size="lg">
                  <Heart className="h-4 w-4 mr-2" />Donar ahora
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{success ? "¡Donación exitosa!" : "Apoya este proyecto"}</DialogTitle></DialogHeader>
                {success ? (
                  <div className="text-center py-6 space-y-4">
                    <CheckCircle2 className="h-14 w-14 text-secondary mx-auto" />
                    <p className="text-sm text-muted-foreground">Te enviamos el comprobante a tu correo.</p>
                    <div className="bg-muted rounded-lg p-3 text-left text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-secondary" /> Comprobante #DN-{Math.floor(Math.random() * 9999)}
                    </div>
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
                      <Label htmlFor="anon" className="flex items-center gap-2 cursor-pointer">
                        <EyeOff className="h-4 w-4" />Donar de forma anónima
                      </Label>
                      <Switch id="anon" checked={anon} onCheckedChange={setAnon} />
                    </div>
                    <div className="rounded-lg border p-3 flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" /> Pago seguro vía pasarela externa
                    </div>
                    <Button className="w-full bg-gradient-warm shadow-warm" onClick={donate}>Confirmar donación</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <div className="flex gap-2">
              {["WhatsApp", "Facebook", "LinkedIn"].map((n) => (
                <Button key={n} variant="outline" size="sm" className="flex-1" onClick={() => share(n)}>
                  <Share2 className="h-3 w-3 mr-1" />{n}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3 text-sm">Donaciones recientes</h3>
            <ul className="space-y-3">
              {recentDonations.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{d.donor[0]}</AvatarFallback></Avatar>
                    <div>
                      <div className="font-medium">{d.donor}</div>
                      <div className="text-xs text-muted-foreground">{d.date}</div>
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
