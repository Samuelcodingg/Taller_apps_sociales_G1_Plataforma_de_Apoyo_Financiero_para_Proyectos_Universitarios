import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Target } from "lucide-react";
import type { Campaign } from "@/lib/mock-data";

export function CampaignCard({ c }: { c: Campaign }) {
  const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
  return (
    <Link to={`/campana/${c.id}`} className="group block">
      <Card className="overflow-hidden border-border/60 hover:shadow-warm transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={c.image}
            alt={c.title}
            loading="lazy"
            width={1024}
            height={768}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {c.categories.slice(0, 2).map((cat) => (
              <Badge key={cat} className="bg-background/90 text-foreground hover:bg-background backdrop-blur">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {c.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {c.creator.name} · {c.university}
            </p>
          </div>
          <Progress value={pct} className="h-2" />
          <div className="flex items-center justify-between text-sm">
            <div className="font-semibold text-primary">S/ {c.raised.toLocaleString()}</div>
            <div className="text-muted-foreground">{pct}% de S/ {c.goal.toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.donors} donantes</span>
            <span className="flex items-center gap-1"><Target className="h-3 w-3" />Meta {new Date(c.deadline).toLocaleDateString("es-PE", { month: "short", day: "numeric" })}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
