-- Complete Consolidated Schema Setup Script
-- Paste and run this entire script inside your Supabase SQL Editor.
-- NOTE: This drops ONLY the 'leads' and 'search_history' tables to ensure a clean rebuild of their schema, leaving all other tables in your database untouched.

-- 0. Clean Fresh Start: Drop only the tables used by this project
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS search_history;

-- 1. Create leads table with all standard, CRM, and modern intelligence fields
CREATE TABLE leads (
  id                      BIGSERIAL PRIMARY KEY,
  name                    TEXT NOT NULL,
  phone                   TEXT,
  website                 TEXT,
  score                   INT DEFAULT 0,
  reason                  TEXT,
  source                  TEXT,
  called                  BOOLEAN DEFAULT false,
  called_at               TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  address                 TEXT DEFAULT NULL,
  rating                  NUMERIC DEFAULT NULL,
  reviews                 INT DEFAULT NULL,
  maps_url                TEXT DEFAULT NULL,
  
  -- CRM Pipeline Fields
  crm_status              TEXT DEFAULT NULL, -- 'no_answer', 'contacted', 'meeting', 'won', 'lost'
  notes                   TEXT DEFAULT NULL,
  follow_up_at            TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  deal_value              NUMERIC DEFAULT 0,
  email                   TEXT DEFAULT NULL,
  pipeline_stage          TEXT DEFAULT 'Prospect', -- For legacy/safety compatibility
  reminder_date           TIMESTAMP WITH TIME ZONE DEFAULT NULL,

  -- Revenue-Driven Intelligence & Multi-dimensional Scoring
  revenue_score           INT DEFAULT 0,
  contact_score           INT DEFAULT 0,
  final_score             INT DEFAULT 0,
  problems                JSONB DEFAULT NULL,
  segment                 TEXT[] DEFAULT '{}',
  estimated_loss          INT DEFAULT 0,
  recommended_service     TEXT DEFAULT NULL,
  outreach_context        JSONB DEFAULT NULL,
  priority_rank           INT DEFAULT 0,
  conversion_probability  INT DEFAULT 0,

  -- Upgraded Scoring & Tier Columns (Phase B1)
  intent_score            INTEGER DEFAULT 0,
  digital_gap_score       INTEGER DEFAULT 0,
  tier                    TEXT DEFAULT 'cold'
);

-- 2. Create unique index on phone to prevent duplicates (only on non-null phone numbers)
CREATE UNIQUE INDEX unique_phone_idx
ON leads (phone)
WHERE phone IS NOT NULL;

-- 3. Create high-performance indexes for leads table
CREATE INDEX leads_score_idx ON leads (score DESC);
CREATE INDEX leads_called_idx ON leads (called);
CREATE INDEX leads_priority_rank_idx ON leads (priority_rank DESC);

-- Upgraded indexes for Phase B1 performance
CREATE INDEX leads_tier_idx ON leads (tier);
CREATE INDEX leads_intent_score_idx ON leads (intent_score DESC);
CREATE INDEX leads_digital_gap_idx ON leads (digital_gap_score DESC);

-- 4. Create search_history table to track search runs
CREATE TABLE search_history (
  id            BIGSERIAL PRIMARY KEY,
  query         TEXT UNIQUE NOT NULL,
  last_run_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  run_count     INT DEFAULT 1,
  last_stored   INT DEFAULT 0
);

-- 5. Create performance index for search history
CREATE INDEX search_history_last_run_idx ON search_history (last_run_at DESC);

-- ═══════════════════════════════════════════════════
-- MIGRATION: Add new scoring columns (run once on 
-- existing databases that already have the leads table)
-- ═══════════════════════════════════════════════════
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS intent_score 
    INTEGER DEFAULT 0;

ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS digital_gap_score 
    INTEGER DEFAULT 0;

ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS tier 
    TEXT DEFAULT 'cold';

CREATE INDEX IF NOT EXISTS leads_tier_idx 
  ON leads(tier);

CREATE INDEX IF NOT EXISTS leads_intent_score_idx 
  ON leads(intent_score DESC);

CREATE INDEX IF NOT EXISTS leads_digital_gap_idx 
  ON leads(digital_gap_score DESC);

-- Update existing rows to extract tier from problems JSONB
UPDATE leads 
SET tier = problems->>'tier'
WHERE problems->>'tier' IS NOT NULL
  AND tier = 'cold';

-- Update existing rows to extract intentNorm from problems JSONB
UPDATE leads
SET intent_score = (problems->>'intentNorm')::integer
WHERE problems->>'intentNorm' IS NOT NULL
  AND intent_score = 0;

-- Update existing rows to extract digitalGapNorm from problems JSONB
UPDATE leads
SET digital_gap_score = (problems->>'digitalGapNorm')::integer
WHERE problems->>'digitalGapNorm' IS NOT NULL
  AND digital_gap_score = 0;
