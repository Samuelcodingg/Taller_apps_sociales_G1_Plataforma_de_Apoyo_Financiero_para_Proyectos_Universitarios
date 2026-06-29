export type Campaign = {
  id: string;
  title: string;
  description: string;
  image: string;
  goal: number;
  raised: number;
  donors: number;
  deadline: string;
  university: string;
  faculty: string;
  categories: string[];
  status: "borrador" | "activa" | "finalizada";
  creator: { name: string; verified: boolean; avatar?: string };
  trending: number;
};

// --- Tipos que devuelve el Campaign Core Service ---
export type MediaDTO = { type: string; url: string };

export type CreatorDTO = {
  id: string | null;
  name: string;
  university: string | null;
  career: string | null;
  verified: boolean;
};

export type CampaignSummary = {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  status: string;
  endDate: string;
  createdAt: string;
  cover: MediaDTO | null;
  categories: string[];
  creator: CreatorDTO;
  donorsCount: number;
};

export type CampaignDetail = CampaignSummary & {
  likes: number;
  shares: number;
  bookmarks: number;
  follows: number;
  interests: number;
  myInteractions: string[];
  media: MediaDTO[];
  updates: Array<{
    id: string;
    title: string | null;
    message: string;
    imageUrl: string | null;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    parentId: string | null;
    createdAt: string;
  }>;
  recentDonations: Array<{
    donor: string;
    amount: number;
    donatedAt: string;
    timeAgo: string;
  }>;
};

export type CreateCampaignRequest = {
  title: string;
  description: string;
  goalAmount: number;
  endDate: string;
  media: File;
  status?: "DRAFT" | "ACTIVE";
};
