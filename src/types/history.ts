export type SearchHistoryItem = {
  id: number;
  query: string;
  created_at: string;
  last_run_at: string;
  run_count: number;
  last_stored: number;
  live_count?: number;
  avg_score?: number;
  hot_count?: number;
};
