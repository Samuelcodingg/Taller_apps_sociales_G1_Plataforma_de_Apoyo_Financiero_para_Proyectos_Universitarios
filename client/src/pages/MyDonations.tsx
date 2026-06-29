import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, HeartHandshake, Wallet, Clock, Loader2 } from "lucide-react";
import { useMyDonationsQuery } from "@/slices/apiSlice";

const PLACEHOLDER_IMAGE = "https://placehold.co/160x160?text=Campa%C3%B1a";

const statusLabel: Record<string, string> = {
  COMPLETED: "Completada",
  PENDING: "Pendiente",
  FAILED: "Fallida",
};

const MyDonations = () => {
  const { data: donations, isLoading } = useMyDonationsQuery();

  const stats = useMemo(() => {
    const all = donations ?? [];
    const completed = all.filter((d) => d.status === "COMPLETED");
    const totalDonado = completed.reduce((acc, d) => acc + d.amount, 0);
    const ultima = completed[0]?.amount ?? 0; // vienen ordenadas desc por fecha
    const campañas = new Set(completed.map((d) => d.campaignId)).size;
    const pendientes = all.filter((d) => d.status === "PENDING").length;
    return [
      { label: "Total donado", value: `S/ ${totalDonado.toLocaleString()}`, icon: ArrowUpRight, hint: `${completed.length} donación(es)` },
      { label: "Última donación", value: `S/ ${ultima.toLocaleString()}`, icon: Wallet, hint: "más reciente" },
      { label: "Campañas apoyadas", value: String(campañas), icon: HeartHandshake, hint: "distintas" },
      { label: "Pendientes", value: String(pendientes), icon: Clock, hint: "pagos sin confirmar" },
    ];
  }, [donations]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Mis donaciones</h1>
            <p className="text-muted-foreground">Historial de tu apoyo a las campañas.</p>
          </div>
          <Button asChild className="bg-gradient-warm shadow-warm">
            <Link to="/explorar">Explorar campañas</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold mt-2">{stat.value}</div>
              <div className="text-xs text-secondary mt-1">{stat.hint}</div>
            </Card>
          ))}
        </div>

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Historial de donaciones</h2>

          {isLoading ? (
            <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (donations ?? []).length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Aún no has donado.{" "}
              <Link to="/explorar" className="text-primary">Explora campañas</Link> y apoya una.
            </div>
          ) : (
            <div className="space-y-4">
              {(donations ?? []).map((d) => (
                <div key={d.donationId} className="grid gap-4 border-b pb-4 last:border-0 last:pb-0 sm:grid-cols-[80px_1fr_auto] sm:items-center">
                  <img src={d.campaignCover ?? PLACEHOLDER_IMAGE} alt={d.campaignTitle} loading="lazy" className="h-20 w-20 rounded-lg object-cover" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{d.campaignTitle}</h3>
                      <Badge variant={d.status === "COMPLETED" ? "secondary" : "outline"}>
                        {statusLabel[d.status] ?? d.status}
                      </Badge>
                      {d.isAnonymous && <Badge variant="outline">Anónima</Badge>}
                    </div>
                    <div className="text-sm font-semibold text-primary">S/ {d.amount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(d.donatedAt).toLocaleString("es-PE")}
                      {d.message ? ` · "${d.message}"` : ""}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild><Link to={`/campana/${d.campaignId}`}>Ver campaña</Link></Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default MyDonations;
