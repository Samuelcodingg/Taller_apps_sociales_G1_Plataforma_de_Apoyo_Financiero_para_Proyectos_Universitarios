import { AppLayout } from "@/components/AppLayout";
import { CampaignCard } from "@/components/CampaignCard";
import { Flame, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTrendingQuery } from "@/slices/apiSlice";
import { mapSummaryToCampaign } from "@/lib/mapCampaign";

const Tendencias = () => {
  const { data, isLoading } = useTrendingQuery(12);
  const top = (data ?? []).map(mapSummaryToCampaign);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-warm grid place-items-center text-primary-foreground shadow-warm">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Proyectos en tendencia</h1>
            <p className="text-muted-foreground">Índice de viralidad: velocidad de donaciones y compartidos (últimas 24h).</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : top.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Aún no hay proyectos en tendencia.</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((c, i) => (
              <div key={c.id} className="relative">
                <Badge className="absolute -top-2 -left-2 z-10 bg-gradient-warm shadow-warm border-0">#{i + 1}</Badge>
                <CampaignCard c={c} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Tendencias;
