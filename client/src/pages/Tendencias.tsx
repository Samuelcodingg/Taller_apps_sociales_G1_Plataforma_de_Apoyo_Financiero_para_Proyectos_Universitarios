import { AppLayout } from "@/components/AppLayout";
import { CampaignCard } from "@/components/CampaignCard";
import { campaigns } from "@/lib/mock-data";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Tendencias = () => {
  const top = [...campaigns].sort((a, b) => b.trending - a.trending);
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-warm grid place-items-center text-primary-foreground shadow-warm">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Proyectos en tendencia</h1>
            <p className="text-muted-foreground">Los más populares según donaciones recientes y compartidos.</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((c, i) => (
            <div key={c.id} className="relative">
              <Badge className="absolute -top-2 -left-2 z-10 bg-gradient-warm shadow-warm border-0">#{i + 1} · {c.trending}🔥</Badge>
              <CampaignCard c={c} />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Tendencias;
