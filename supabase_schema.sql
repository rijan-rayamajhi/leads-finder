-- Consolidated Database Schema Setup Script
-- Paste and run this entire script inside your Supabase SQL Editor.
-- NOTE: Drops leads, search_history, profiles, and audit_logs tables to ensure a clean build.

-- 0. Clean Fresh Start: Drop existing tables, triggers, and trigger functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.leads;
DROP TABLE IF EXISTS public.search_history;

-- 1. Create leads table with all standard, CRM, and modern intelligence fields
CREATE TABLE public.leads (
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
  meeting_notes           TEXT DEFAULT NULL,
  meeting_link            TEXT DEFAULT NULL,

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

  -- Upgraded Scoring & Tier Columns
  intent_score            INTEGER DEFAULT 0,
  digital_gap_score       INTEGER DEFAULT 0,
  tier                    TEXT DEFAULT 'cold'
);

-- 2. Create unique index on phone to prevent duplicates (only on non-null phone numbers)
CREATE UNIQUE INDEX unique_phone_idx
ON public.leads (phone)
WHERE phone IS NOT NULL;

-- 3. Create high-performance indexes for leads table
CREATE INDEX leads_score_idx ON public.leads (score DESC);
CREATE INDEX leads_called_idx ON public.leads (called);
CREATE INDEX leads_priority_rank_idx ON public.leads (priority_rank DESC);
CREATE INDEX leads_tier_idx ON public.leads (tier);
CREATE INDEX leads_intent_score_idx ON public.leads (intent_score DESC);
CREATE INDEX leads_digital_gap_idx ON public.leads (digital_gap_score DESC);

-- 4. Create search_history table to track search runs
CREATE TABLE public.search_history (
  id            BIGSERIAL PRIMARY KEY,
  query         TEXT UNIQUE NOT NULL,
  last_run_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  run_count     INT DEFAULT 1,
  last_stored   INT DEFAULT 0
);

-- 5. Create performance index for search history
CREATE INDEX search_history_last_run_idx ON public.search_history (last_run_at DESC);

-- 6. Create profiles table linked to Supabase Auth users
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT DEFAULT '',
  avatar_url  TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'disabled', 'blocked'
  role        TEXT NOT NULL DEFAULT 'user',    -- 'super_admin', 'user'
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes on profiles status and role
CREATE INDEX profiles_status_idx ON public.profiles (status);
CREATE INDEX profiles_role_idx ON public.profiles (role);

-- 8. Create audit logs table to record admin actions
CREATE TABLE public.audit_logs (
  id                BIGSERIAL PRIMARY KEY,
  action_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_by_email   TEXT NOT NULL,
  target_user       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_email TEXT NOT NULL,
  action            TEXT NOT NULL, -- 'approve', 'reject', 'disable', 'block'
  details           TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Enable Row Level Security (RLS) on profiles and audit_logs tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for Profiles
-- Allow authenticated users to SELECT only their own profile
DROP POLICY IF EXISTS select_own_profile ON public.profiles;
CREATE POLICY select_own_profile ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Note: No client INSERT, UPDATE, or DELETE policies exist.
-- All database writes/updates are mediated securely by backend Next.js API endpoints
-- which run using the server-side service-role client (bypassing RLS).

-- 11. PostgreSQL trigger function to automatically create a profile when a new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'user',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Bind the trigger function to the auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
