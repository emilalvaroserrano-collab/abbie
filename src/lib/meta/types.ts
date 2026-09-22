export type TokenHealth = {
  label: string;
  valid: boolean;
  type: string;
  expiresAt: number;
  scopes: string[];
};

export type PageSummary = {
  id: string;
  name: string;
  category: string;
  fanCount: number;
  followersCount: number;
  about: string;
  pictureUrl: string | null;
  username: string | null;
  instagramId: string | null;
};

export type IgAccount = {
  id: string;
  username: string;
  name: string;
  followersCount: number;
  mediaCount: number;
  pictureUrl: string | null;
};

export type ThreadPreview = {
  id: string;
  pageId: string;
  pageName: string;
  channel: "messenger" | "instagram";
  name: string;
  participantId: string;
  snippet: string;
  updatedAt: string;
  messageCount: number;
  unreadCount: number;
  canReply: boolean;
};

export type ChatMessage = {
  id: string;
  text: string;
  fromId: string;
  fromName: string;
  createdAt: string;
  isPage: boolean;
  attachmentUrl: string | null;
  attachmentKind: "image" | "file" | null;
};

export type ConversationDetail = {
  id: string;
  pageId: string;
  pageName: string;
  name: string;
  participantId: string;
  canReply: boolean;
  messages: ChatMessage[];
};

export type PostSummary = {
  id: string;
  pageId: string;
  pageName: string;
  message: string;
  createdAt: string;
  permalink: string | null;
  picture: string | null;
  likes: number;
  comments: number;
  shares: number;
};

export type BusinessSummary = {
  id: string;
  name: string;
};

export type AdAccount = {
  id: string;
  name: string;
  status: number;
  currency: string;
  spent: string;
  businessName: string | null;
};

export type AdCampaign = {
  id: string;
  accountId: string;
  name: string;
  objective: string;
  status: string;
  createdAt: string;
};

export type DashboardData = {
  operator: { id: string; name: string };
  tokenHealth: { system: TokenHealth; user: TokenHealth };
  pages: PageSummary[];
  instagram: IgAccount[];
  inbox: { unread: number; recent: ThreadPreview[] };
  recentPosts: PostSummary[];
  fetchedAt: string;
};

export type AccountsData = {
  operator: { id: string; name: string };
  tokenHealth: { system: TokenHealth; user: TokenHealth };
  pages: PageSummary[];
  instagram: IgAccount[];
  businesses: BusinessSummary[];
};

import type { WaLinkStatus } from "@/lib/whatsapp/types";

export type WhatsAppLink = {
  status: WaLinkStatus;
  userName: string | null;
  userPhone: string | null;
  error: string | null;
  saved: boolean;
};

export type OperatorSnapshot = {
  operator: string;
  pages: Array<{
    id: string;
    name: string;
    fans: number;
    category: string;
    about: string;
  }>;
  instagram: Array<{ id: string; username: string; followers: number }>;
  adAccounts: AdAccount[];
  inboxUnread: number;
  whatsappLink: WhatsAppLink;
};

export type ActionResult = {
  ok: boolean;
  id?: string;
  message: string;
  extra?: Record<string, string>;
};

export type PublishResult = {
  results: Array<{ pageId: string; pageName: string } & ActionResult>;
};

export type LeadSource = "form" | "messenger" | "comment" | "mention" | "audience" | "page";

export type LeadHit = {
  id: string;
  source: LeadSource;
  name: string;
  score: number;
  reason: string;
  pageName: string;
  pageId: string;
  snippet: string;
  contact: string | null;
  when: string | null;
  conversationId?: string;
  participantId?: string;
  audienceSize?: string;
};

export type LeadBoard = {
  query: string;
  generatedAt: string;
  counts: Partial<Record<LeadSource, number>>;
  leads: LeadHit[];
  notes: string[];
};
