import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CampaignCard } from "@/components/CampaignCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { allCategories, campaigns, universities } from "@/lib/mock-data";

const Explorar = () => {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [uni, setUni] = useState<string>("all");
  const [sort, setSort] = useState<string>("recent");

  const list = useMemo(() => {
    let r = campaigns.filter((c) => c.status === "activa");
    if (q) r = r.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));
    if (cat !== "all") r = r.filter((c) => c.categories.includes(cat));
    if (uni !== "all") r = r.filter((c) => c.university === uni);
    if (sort === "funded") r = [...r].sort((a, b) => b.raised - a.raised);
    if (sort === "trending") r = [...r].sort((a, b) => b.trending - a.trending);
    return r;
  }, [q, cat, uni, sort]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Explora proyectos</h1>
          <p className="text-muted-foreground">Encuentra iniciativas universitarias que te inspiran.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="pl-9" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={uni} onValueChange={setUni}>
            <SelectTrigger><SelectValue placeholder="Universidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las facultades</SelectItem>
              {universities.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="funded">Más financiados</SelectItem>
              <SelectItem value="trending">Tendencia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(cat !== "all" || uni !== "all") && (
          <div className="flex flex-wrap gap-2">
            {cat !== "all" && <Badge variant="secondary">{cat} <button className="ml-1" onClick={() => setCat("all")}>×</button></Badge>}
            {uni !== "all" && <Badge variant="secondary">{uni} <button className="ml-1" onClick={() => setUni("all")}>×</button></Badge>}
            <Button size="sm" variant="ghost" onClick={() => { setCat("all"); setUni("all"); }}>Limpiar</Button>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => <CampaignCard key={c.id} c={c} />)}
        </div>
        {list.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No encontramos proyectos con esos filtros.</div>
        )}
      </div>
    </AppLayout>
  );
};

export default Explorar;
