import { Campaign, CampaignSummary } from "@/types/campaign";

const PLACEHOLDER_IMAGE = "https://placehold.co/600x400?text=Campa%C3%B1a";

// Devuelve una URL de imagen usable o un placeholder. Descarta imagenes locales
// de pruebas (localhost) y, en paginas HTTPS, las http:// (mixed content): de lo
// contrario el navegador lanza errores y muestra imagenes rotas. Las campañas
// reales en produccion se sirven desde S3 por HTTPS.
export const safeImageUrl = (url?: string | null): string => {
  if (!url) return PLACEHOLDER_IMAGE;
  if (/localhost|127\.0\.0\.1/i.test(url)) return PLACEHOLDER_IMAGE;
  const isHttpsPage =
    typeof window !== "undefined" && window.location.protocol === "https:";
  if (isHttpsPage && url.startsWith("http://")) return PLACEHOLDER_IMAGE;
  return url;
};

// Convierte el resumen del Campaign Core Service al tipo Campaign que usan las
// tarjetas y el catalogo del front.
export const mapSummaryToCampaign = (s: CampaignSummary): Campaign => ({
  id: s.id,
  title: s.title,
  description: s.description,
  image: safeImageUrl(s.cover?.url),
  goal: s.goalAmount,
  raised: s.currentAmount,
  donors: s.donorsCount,
  deadline: s.endDate,
  university: s.creator.university ?? "—",
  faculty: s.creator.career ?? "",
  categories: s.categories,
  status:
    s.status === "ACTIVE"
      ? "activa"
      : s.status === "FINISHED"
        ? "finalizada"
        : "borrador",
  creator: { name: s.creator.name, verified: s.creator.verified },
  trending: 0,
});
