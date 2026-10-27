export type FruitType = 'PARAMECIA' | 'ZOAN' | 'ANCIENT_ZOAN' | 'MYTHICAL_ZOAN' | 'LOGIA';

export interface DevilFruit {
  name: string;
  type: FruitType;
  awakened: boolean;
}

export type WantedStatus = 'ACTIVE' | 'CAPTURED' | 'DECEASED';

export interface CrewRef {
  id: string;
  name: string;
}

export interface WantedSummary {
  id: string;
  name: string;
  epithet: string;
  bounty: number;
  status: WantedStatus;
  imageUrl?: string;
  crew?: CrewRef;
  devilFruit?: DevilFruit;
  updatedAt: string;
}

export interface WantedDetail extends WantedSummary {
  description: string;
  affiliations?: string[];
  lastKnownLocation?: string;
  dangerLevel?: string;
}

export interface WantedPage {
  content: WantedSummary[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface CrewRole {
  title: string;
  characterName: string;
}

export interface Crew {
  id: string;
  name: string;
  captain: string;
  shipName: string;
  totalBounty: number;
  flagUrl?: string;
  roles?: CrewRole[];
}

export type NewsType = 'WORLD_GOVERNMENT' | 'PIRATE_INCIDENT' | 'REVOLUTIONARY' | 'MARINE_MOVEMENT' | 'GENERAL';
export type NewsPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type NewsStatus = 'RUMOR' | 'CONFIRMED' | 'DEBUNKED';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  type: NewsType;
  priority: NewsPriority;
  status: NewsStatus;
  publishedAt: string;
  author?: string;
}

export interface NewsDetail extends NewsItem {
  body: string;
  source?: string;
  location?: string;
  relatedWantedIds?: string[];
}

export interface NewsFeed {
  items: NewsItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export interface StageMetric {
  label: string;
  value: string | number;
}

export interface SagaStage {
  id: string;
  order: number;
  title: string;
  island: string;
  islandCoordinates: { x: number; y: number };
  narrative: string;
  palette: Palette;
  metrics: StageMetric[];
}

export interface SagaSummary {
  id: string;
  title: string;
  order: number;
  description: string;
  stageCount: number;
  coverImage?: string;
}

export interface SagaStory {
  saga: SagaSummary;
  stages: SagaStage[];
}

export interface LogPoseStatus {
  unlocked: boolean;
  currentBearing: string;
  nextIsland: string;
  chargePercentage: number;
  approvedBy?: string;
}

export interface DashboardSummary {
  totalBountyTracked: number;
  activeWantedCount: number;
  verifiedNewsCount: number;
  unresolvedRumorsCount: number;
  logPose: LogPoseStatus;
  crewName?: string;
}

export interface User {
  id: string;
  email: string;
  teamCode: string;
  teamName: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  teamName: string;
  email: string;
  password: string;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  fields?: Record<string, string>;
  code?: string;
}
