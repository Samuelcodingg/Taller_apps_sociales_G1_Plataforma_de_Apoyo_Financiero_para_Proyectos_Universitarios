import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CampaignCard } from "@/components/CampaignCard";
import { ArrowRight, Sparkles, Heart, GraduationCap, Loader2 } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { usePersonalizedFeedQuery, useTrendingQuery } from "@/slices/apiSlice";
import { mapSummaryToCampaign } from "@/lib/mapCampaign";

const Index = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isDonor = user?.role === "DONOR";

  // Donante autenticado -> feed personalizado; resto -> tendencias.
  const { data: feed, isLoading: loadingFeed } = usePersonalizedFeedQuery(6, {
    skip: !isDonor,
  });
  const { data: trend, isLoading: loadingTrend } = useTrendingQuery(6, {
    skip: isDonor,
  });

  const personalized = isDonor;
  const list = (isDonor ? feed : trend) ?? [];
  const isLoading = isDonor ? loadingFeed : loadingTrend;
  const recommended = list.map(mapSummaryToCampaign).slice(0, 3);

  return (
    <AppLayout>
      <section className="relative overflow-hidden rounded-3xl border bg-card shadow-soft mb-10">
        <div className="grid lg:grid-cols-2 items-center">
          <div className="p-8 sm:p-12 space-y-6">
            <Badge className="bg-accent text-accent-foreground hover:bg-accent border-0">
              <Sparkles className="h-3 w-3 mr-1" /> Hecho por estudiantes
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Sembramos ideas,{" "}
              <span className="bg-gradient-warm bg-clip-text text-transparent">
                cosechamos futuro
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              La plataforma de crowdfunding para proyectos universitarios. Apoya
              iniciativas reales, hechas por estudiantes verificados.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gradient-warm shadow-warm hover:opacity-95"
              >
                <Link to="/explorar">
                  Explorar proyectos <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={!!user ? "/profile" : "/auth"}>
                  {!!user ? "Ir al perfil" : "Crear cuenta"}
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-secondary" /> 1,200+
                creadores
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-primary" /> S/ 480k recaudados
              </div>
            </div>
          </div>
          <div className="relative h-64 lg:h-full lg:min-h-[420px]">
            <img
              src={hero}
              alt="Estudiantes colaborando"
              width={1536}
              height={1024}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/40 to-transparent lg:via-transparent" />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {personalized ? "Recomendados para ti" : "Tendencias"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {personalized
                ? "Personalizado con IA según tu historial e intereses"
                : "Los proyectos más virales del momento"}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/explorar">
              Ver todos <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : recommended.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Aún no hay proyectos para mostrar. <Link to="/explorar" className="text-primary">Explora todos</Link>.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c) => (
              <CampaignCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          {
            t: "Crea tu campaña",
            d: "Cuenta tu idea y define tu meta.",
            to: "/crear",
          },
          {
            t: "Verifica tu identidad",
            d: "Sube tu carnet universitario.",
            to: "/register/validation",
          },
          {
            t: "Comparte y recauda",
            d: "Difunde y recibe donaciones.",
            to: "/explorar",
          },
        ].map((s, i) => (
          <Link
            to={s.to}
            key={i}
            className="rounded-2xl border bg-card p-6 hover:shadow-warm transition group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-warm grid place-items-center text-primary-foreground font-semibold mb-3">
              {i + 1}
            </div>
            <h3 className="font-semibold group-hover:text-primary">{s.t}</h3>
            <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
          </Link>
        ))}
      </section>
    </AppLayout>
  );
};

export default Index;
