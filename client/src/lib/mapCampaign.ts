import { Campaign, CampaignSummary } from "@/types/campaign";

const PLACEHOLDER_IMAGE = "https://placehold.co/600x400?text=Campa%C3%B1a";

// Convierte el resumen del Campaign Core Service al tipo Campaign que usan las
// tarjetas y el catalogo del front.
export const mapSummaryToCampaign = (s: CampaignSummary): Campaign => ({
  id: s.id,
  title: s.title,
  description: s.description,
  image: s.cover?.url ?? PLACEHOLDER_IMAGE,
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
