import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Wallet, Eye, Users, Plus } from "lucide-react";
import { campaigns } from "@/lib/mock-data";

const stats = [
  { label: "Total recaudado", value: "S/ 5,420", icon: TrendingUp, hint: "+12% esta semana" },
  { label: "Disponible", value: "S/ 3,820", icon: Wallet, hint: "S/ 1,600 retenido" },
  { label: "Donantes", value: "142", icon: Users, hint: "8 nuevos hoy" },
  { label: "Visitas al perfil", value: "2,431", icon: Eye, hint: "+340 esta semana" },
];

const Dashboard = () => {
  const mine = campaigns.slice(0, 2);
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
          <div className="space-y-4">
            {mine.map((c) => {
              const pct = Math.round((c.raised / c.goal) * 100);
              return (
                <div key={c.id} className="grid sm:grid-cols-[80px_1fr_auto] gap-4 items-center pb-4 border-b last:border-0 last:pb-0">
                  <img src={c.image} alt={c.title} loading="lazy" width={1024} height={768} className="w-20 h-20 object-cover rounded-lg" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{c.title}</h3>
                      <Badge variant="secondary">{c.status}</Badge>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="text-xs text-muted-foreground">S/ {c.raised.toLocaleString()} de S/ {c.goal.toLocaleString()} · {c.donors} donantes</div>
                  </div>
                  <Button variant="outline" size="sm" asChild><Link to={`/campana/${c.id}`}>Ver</Link></Button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
