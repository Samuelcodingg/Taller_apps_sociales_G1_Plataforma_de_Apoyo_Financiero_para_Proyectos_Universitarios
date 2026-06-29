import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Target, Users, Megaphone, Plus, Loader2 } from "lucide-react";
import { useListCampaignsQuery } from "@/slices/apiSlice";

const PLACEHOLDER_IMAGE = "https://placehold.co/160x160?text=Campa%C3%B1a";

const Dashboard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: all, isLoading } = useListCampaignsQuery();

  // Solo las campañas del creador autenticado.
  const mine = useMemo(
    () => (all ?? []).filter((c) => c.creator.id === user?.id),
    [all, user],
  );

  const stats = useMemo(() => {
    const raised = mine.reduce((acc, c) => acc + c.currentAmount, 0);
    const goal = mine.reduce((acc, c) => acc + c.goalAmount, 0);
    const donors = mine.reduce((acc, c) => acc + c.donorsCount, 0);
    const active = mine.filter((c) => c.status === "ACTIVE").length;
    const pct = goal > 0 ? Math.round((raised / goal) * 100) : 0;
    return [
      { label: "Total recaudado", value: `S/ ${raised.toLocaleString()}`, icon: TrendingUp, hint: `${pct}% de la meta total` },
      { label: "Meta total", value: `S/ ${goal.toLocaleString()}`, icon: Target, hint: `${mine.length} campaña(s)` },
      { label: "Donantes", value: String(donors), icon: Users, hint: "en todas tus campañas" },
      { label: "Campañas activas", value: String(active), icon: Megaphone, hint: `${mine.length} en total` },
    ];
  }, [mine]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Mi panel</h1>
            <p className="text-muted-foreground">Resumen de tus campañas y métricas.</p>
          </div>
          <Button asChild className="bg-gradient-warm shadow-warm">
            <Link to="/crear"><Plus className="h-4 w-4 mr-1" />Nueva campaña</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold mt-2">{s.value}</div>
              <div className="text-xs text-secondary mt-1">{s.hint}</div>
            </Card>
          ))}
        </div>

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Mis campañas</h2>

          {isLoading ? (
            <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : mine.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Aún no has creado campañas.{" "}
              <Link to="/crear" className="text-primary">Crea la primera</Link>.
            </div>
          ) : (
            <div className="space-y-4">
              {mine.map((c) => {
                const pct = c.goalAmount > 0 ? Math.round((c.currentAmount / c.goalAmount) * 100) : 0;
                return (
                  <div key={c.id} className="grid sm:grid-cols-[80px_1fr_auto] gap-4 items-center pb-4 border-b last:border-0 last:pb-0">
                    <img src={c.cover?.url ?? PLACEHOLDER_IMAGE} alt={c.title} loading="lazy" className="w-20 h-20 object-cover rounded-lg" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{c.title}</h3>
                        <Badge variant="secondary">{c.status}</Badge>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        S/ {c.currentAmount.toLocaleString()} de S/ {c.goalAmount.toLocaleString()} · {c.donorsCount} donantes · {pct}%
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild><Link to={`/campana/${c.id}`}>Ver</Link></Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
