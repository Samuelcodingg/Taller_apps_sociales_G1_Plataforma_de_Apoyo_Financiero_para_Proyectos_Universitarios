import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { campaigns } from "@/lib/mock-data";
import { ArrowUpRight, Eye, HeartHandshake, Search, Wallet } from "lucide-react";

type DonationMetric = {
  label: string;
  value: string;
  hint: string;
  icon: typeof ArrowUpRight;
};

type SupportedCampaign = {
  id: string;
  title: string;
  raised: number;
  goal: number;
  donors: number;
  image: string;
  status: "activo";
};

const stats: DonationMetric[] = [
  { label: "Total donado", value: "S/ 5,420", icon: ArrowUpRight, hint: "+10% esta semana" },
  { label: "Ultima donacion", value: "S/ 3,820", icon: Wallet, hint: "Tu mejor donacion" },
  { label: "Campañas apoyadas", value: "2", icon: HeartHandshake, hint: "1 nuevo hoy" },
  { label: "Impacto", value: "100", icon: Eye, hint: "personas vieron tu donacion" },
];

const supportedCampaigns: SupportedCampaign[] = [
  {
    id: "1",
    title: "Implementación de Huertos Urbanos Tecnificados",
    raised: 4000,
    goal: 8000,
    donors: 142,
    image: campaigns[0].image,
    status: "activo",
  },
  {
    id: "2",
    title: "Implementación de Robótica en Entornos Educativos",
    raised: 10000,
    goal: 20000,
    donors: 342,
    image: campaigns[1].image,
    status: "activo",
  },
];

function DonationProgress({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/90">
      <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
    </div>
  );
}

function DonationRow({ campaign }: { campaign: SupportedCampaign }) {
  const pct = Math.round((campaign.raised / campaign.goal) * 100);

  return (
    <div className="grid gap-4 border-b pb-4 last:border-0 last:pb-0 sm:grid-cols-[80px_1fr_auto] sm:items-center">
      <img
        src={campaign.image}
        alt={campaign.title}
        loading="lazy"
        width={1024}
        height={768}
        className="h-20 w-20 rounded-lg object-cover"
      />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{campaign.title}</h3>
          <Badge className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground hover:bg-secondary">
            {campaign.status}
          </Badge>
        </div>
        <DonationProgress value={pct} />
        <div className="text-xs text-muted-foreground">
          S/ {campaign.raised.toLocaleString()} de S/{campaign.goal.toLocaleString()} - {campaign.donors} donantes
        </div>
      </div>
      <Button variant="outline" size="sm" className="rounded-full border-[#e8e0d9] shadow-none">
        Ver comprobante
      </Button>
    </div>
  );
}

const MyDonations = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Mis donaciones</h1>
            <p className="text-muted-foreground">Resumen de tus campañas y métricas.</p>
          </div>
          <Button className="bg-gradient-warm shadow-warm">
            <Search className="mr-1 h-4 w-4" />
            Nueva donación
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
          <h2 className="font-semibold">Campañas que apoyé</h2>
          <div className="space-y-4">
            {supportedCampaigns.map((campaign) => (
              <DonationRow key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MyDonations;
