export type Lead = {
  id: number;
  name: string | null;
  phone: string | null;
  website: string | null;
  score: number;
  reason: string;
  source: string | null;
  called: boolean;
  called_at: string | null;
  created_at: string;
  last_seen: string;
  address?: string | null;
  rating?: number | null;
  reviews?: number | null;
  maps_url?: string | null;

  // CRM fields
  crm_status?: 'no_answer' | 'contacted' | 'meeting' | 'won' | 'lost';
  notes?: string;
  follow_up_at?: string | null;
  deal_value?: number;
  email?: string | null;

  // Multi-dimensional scoring and analysis
  revenue_score?: number;
  contact_score?: number;
  final_score?: number;
  problems?: {
    primary: string;
    secondary: string[];
    confidence: number;
    digitalGapNorm?: number;
    intentNorm?: number;
    tier?: string;
    hasPhotos?: boolean;
    hasSevenDays?: boolean;
  } | null;

  // Refined revenue-driven fields
  estimated_loss?: number;
  recommended_service?: string;
  outreach_context?: {
    hook: string;
    problem: string;
    outcome: string;
    service: string;
  } | null;
  priority_rank?: number;
  conversion_probability?: number;
  segment?: string[];

  // Upgraded schema fields (Phase B5)
  intent_score?:      number;
  digital_gap_score?: number;
  tier?:              'hot' | 'warm' | 'nurture' | 'cold';
};

export type RawBusiness = {
  name: string;
  phone: string | null;
  website: string | null;
  address?: string | null;
  rating?: number | null;
  reviews?: number | null;
  maps_url?: string | null;
  reviews_list?: Array<{ text: string; rating?: number }> | null;
  business_status?: string;
  types?: string[];
  photos?: unknown[];
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
};

export type PipelineResult = {
  scraped: number;
  filtered: number;
  stored: number;
  skipped_dedup: number;
  skipped_score: number;
};
