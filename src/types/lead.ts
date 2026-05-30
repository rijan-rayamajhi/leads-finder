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
};

export type RawBusiness = {
  name: string;
  phone: string | null;
  website: string | null;
};

export type PipelineResult = {
  scraped: number;
  filtered: number;
  stored: number;
  skipped_dedup: number;
  skipped_score: number;
};
