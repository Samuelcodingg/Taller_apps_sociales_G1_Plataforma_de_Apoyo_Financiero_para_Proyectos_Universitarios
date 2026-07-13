import { AppLayout } from "@/components/AppLayout";
import { CampaignCard } from "@/components/CampaignCard";
import { Bookmark, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMyInteractionsQuery } from "@/slices/apiSlice";
import { mapSummaryToCampaign } from "@/lib/mapCampaign";

const Guardados = () => {
  // Campañas que el usuario marcó con "Guardar" (BOOKMARK).
  const { data, isLoading } = useMyInteractionsQuery("BOOKMARK");
  const saved = (data ?? []).map(mapSummaryToCampaign);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-warm grid place-items-center text-primary-foreground shadow-warm">
            <Bookmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Guardados</h1>
            <p className="text-muted-foreground">Los proyectos que marcaste para revisar después.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : saved.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Aún no has guardado proyectos. Usa el botón <span className="font-medium">Guardar</span> en una campaña.{" "}
            <Link to="/explorar" className="text-primary">Explora proyectos</Link>.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((c) => <CampaignCard key={c.id} c={c} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Guardados;
