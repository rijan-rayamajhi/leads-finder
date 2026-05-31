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
};

export type RawBusiness = {
  name: string;
  phone: string | null;
  website: string | null;
  address?: string | null;
  rating?: number | null;
  reviews?: number | null;
  maps_url?: string | null;
};

export type PipelineResult = {
  scraped: number;
  filtered: number;
  stored: number;
  skipped_dedup: number;
  skipped_score: number;
};
