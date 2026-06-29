import { baseQueryWithReauth } from "@/services/baseQuery";
import {
  AuthResponse,
  LoginRequest,
  RefreshResponse,
  RegisterCreatorRequest,
  RegisterCreatorResponse,
  RegisterDonorRequest,
  RegisterDonorResponse,
} from "@/types/auth";
import { ProfileResponse, UpdateProfileRequest } from "@/types/profile";
import {
  CampaignDetail,
  CampaignSummary,
  CreateCampaignRequest,
} from "@/types/campaign";
import { BASE_CAMPAIGN_URL, BASE_FUNDING_URL } from "@/lib/constants";
import { createApi } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Profile", "Campaigns", "Donations", "Notifications"],
  endpoints: (builder) => ({
    registerCreator: builder.mutation<
      RegisterCreatorResponse,
      RegisterCreatorRequest
    >({
      query: (data) => {
        const formData = new FormData();

        formData.append("email", data.email);
        formData.append("password", data.password);
        // formData.append("accountType", data.accountType);
        formData.append("document", data.document);

        return {
          url: "/api/auth/register/creator",
          method: "POST",
          body: formData,
        };
      },
    }),

    registerDonor: builder.mutation<
      RegisterDonorResponse,
      RegisterDonorRequest
    >({
      query: (data) => ({
        url: "/api/auth/register/donor",
        method: "POST",
        body: data,
      }),
    }),

    loginUser: builder.mutation<AuthResponse, LoginRequest>({
      query: (data) => ({
        url: "/api/auth/login",
        method: "POST",
        body: data,
      }),
    }),

    refreshToken: builder.mutation<RefreshResponse, { refreshToken: string }>({
      query: (data) => ({
        url: "/api/auth/refresh-token",
        method: "POST",
        body: data,
      }),
    }),

    getMyProfile: builder.query<ProfileResponse, void>({
      query: () => ({
        url: "/api/profile/me",
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),

    updateMyProfile: builder.mutation<ProfileResponse, UpdateProfileRequest>({
      query: (data) => ({
        url: "/api/profile/me",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Profile"],
    }),

    // --- Campaign Core Service (URLs absolutas al microservicio) ---
    listCampaigns: builder.query<CampaignSummary[], void>({
      query: () => ({ url: `${BASE_CAMPAIGN_URL}/api/campaigns`, method: "GET" }),
      providesTags: ["Campaigns"],
    }),

    getCampaign: builder.query<CampaignDetail, string>({
      query: (id) => ({
        url: `${BASE_CAMPAIGN_URL}/api/campaigns/${id}`,
        method: "GET",
      }),
      providesTags: ["Campaigns"],
    }),

    createCampaign: builder.mutation<CampaignDetail, CreateCampaignRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("goalAmount", String(data.goalAmount));
        formData.append("endDate", data.endDate);
        formData.append("media", data.media);
        if (data.status) formData.append("status", data.status);
        return {
          url: `${BASE_CAMPAIGN_URL}/api/campaigns`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Campaigns"],
    }),

    editCampaign: builder.mutation<
      CampaignDetail,
      { id: string; data: Partial<Pick<CreateCampaignRequest, "title" | "description" | "goalAmount" | "endDate">> & { status?: string } }
    >({
      query: ({ id, data }) => ({
        url: `${BASE_CAMPAIGN_URL}/api/campaigns/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Campaigns"],
    }),

    addCampaignUpdate: builder.mutation<
      unknown,
      { id: string; title?: string; message: string; image?: File | null }
    >({
      query: ({ id, title, message, image }) => {
        const formData = new FormData();
        if (title) formData.append("title", title);
        formData.append("message", message);
        if (image) formData.append("image", image);
        return {
          url: `${BASE_CAMPAIGN_URL}/api/campaigns/${id}/updates`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Campaigns"],
    }),

    addCampaignComment: builder.mutation<
      unknown,
      { id: string; content: string; parentId?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `${BASE_CAMPAIGN_URL}/api/campaigns/${id}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Campaigns"],
    }),

    interactCampaign: builder.mutation<
      { type: string; active: boolean; likes: number; shares: number },
      { id: string; type: "LIKE" | "SHARE" | "BOOKMARK" | "FOLLOW" | "INTEREST" }
    >({
      query: ({ id, type }) => ({
        url: `${BASE_CAMPAIGN_URL}/api/campaigns/${id}/interactions`,
        method: "POST",
        body: { type },
      }),
      invalidatesTags: ["Campaigns"],
    }),

    // Campañas con las que el usuario interactua (BOOKMARK/FOLLOW/INTEREST/LIKE).
    myInteractions: builder.query<CampaignSummary[], string>({
      query: (type) => ({
        url: `${BASE_CAMPAIGN_URL}/api/campaigns/me/interactions?type=${type}`,
        method: "GET",
      }),
      providesTags: ["Campaigns"],
    }),

    // --- Funding & Payment Service ---
    donate: builder.mutation<
      { donationId: string; transactionId: string; status: string; amount: number },
      { campaignId: string; amount: number; isAnonymous: boolean; message?: string }
    >({
      query: (body) => ({
        url: `${BASE_FUNDING_URL}/api/donations`,
        method: "POST",
        body,
      }),
    }),

    confirmPayment: builder.mutation<
      { transactionId: string; status: string; applied: boolean },
      { transactionId: string }
    >({
      query: ({ transactionId }) => ({
        url: `${BASE_FUNDING_URL}/api/payments/${transactionId}/confirm`,
        method: "POST",
      }),
      // Al confirmarse el pago cambia el progreso de la campaña.
      invalidatesTags: ["Campaigns", "Donations"],
    }),

    myDonations: builder.query<
      Array<{
        donationId: string;
        campaignId: string;
        campaignTitle: string;
        campaignCover: string | null;
        amount: number;
        status: string;
        isAnonymous: boolean;
        message: string | null;
        donatedAt: string;
      }>,
      void
    >({
      query: () => ({ url: `${BASE_FUNDING_URL}/api/me/donations`, method: "GET" }),
      providesTags: ["Donations"],
    }),

    myNotifications: builder.query<
      {
        unread: number;
        items: Array<{
          id: string;
          type: string;
          title: string;
          body: string | null;
          entityType: string | null;
          entityId: string | null;
          isRead: boolean;
          createdAt: string;
        }>;
      },
      void
    >({
      query: () => ({ url: `${BASE_FUNDING_URL}/api/me/notifications`, method: "GET" }),
      providesTags: ["Notifications"],
    }),

    markNotificationsRead: builder.mutation<{ ok: boolean }, { ids?: string[] } | void>({
      query: (body) => ({
        url: `${BASE_FUNDING_URL}/api/me/notifications/read`,
        method: "POST",
        body: body ?? {},
      }),
      invalidatesTags: ["Notifications"],
    }),

    // --- Discovery (feed personalizado + tendencias) ---
    personalizedFeed: builder.query<CampaignSummary[], number | void>({
      query: (limit = 9) => ({
        url: `${BASE_CAMPAIGN_URL}/api/discovery/feed?limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Campaigns"],
    }),

    trending: builder.query<CampaignSummary[], number | void>({
      query: (limit = 9) => ({
        url: `${BASE_CAMPAIGN_URL}/api/discovery/trending?limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Campaigns"],
    }),

    recordView: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_CAMPAIGN_URL}/api/discovery/campaigns/${id}/view`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useRegisterCreatorMutation,
  useRegisterDonorMutation,
  useLoginUserMutation,
  useRefreshTokenMutation,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useListCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useEditCampaignMutation,
  useAddCampaignUpdateMutation,
  useAddCampaignCommentMutation,
  useInteractCampaignMutation,
  useDonateMutation,
  useConfirmPaymentMutation,
  useMyDonationsQuery,
  useMyInteractionsQuery,
  useMyNotificationsQuery,
  useMarkNotificationsReadMutation,
  usePersonalizedFeedQuery,
  useTrendingQuery,
  useRecordViewMutation,
} = apiSlice;
