import { NextRequest, NextResponse } from 'next/server';
import { scrapeBusinesses } from '@/lib/scraper';
import { scoreLead } from '@/lib/scorer';
import { normalizePhone, normalizeWebsite } from '@/lib/deduplicator';
import { supabase } from '@/lib/supabase';
import { PipelineResult } from '@/types/lead';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const result: PipelineResult = {
      scraped: 0,
      filtered: 0,
      stored: 0,
      skipped_dedup: 0,
      skipped_score: 0,
    };

    // Step 0: Auto-delete leads older than 7 days to keep database clean
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: deleteErr } = await supabase
      .from('leads')
      .delete()
      .lt('created_at', sevenDaysAgo);

    if (deleteErr) {
      console.error('Error performing auto-deletion of old leads:', deleteErr.message);
    }

    // Step 1: Scrape
    const businesses = await scrapeBusinesses(query);
    result.scraped = businesses.length;

    for (const biz of businesses) {
      try {
        // Step 2: Filter — skip if no phone
        if (!biz.phone) continue;
        result.filtered++;

        // Step 3: Normalize
        const phone = normalizePhone(biz.phone);
        const website = normalizeWebsite(biz.website);

        if (!phone) continue;

        // Step 4: Dedup check — skip if phone already exists
        const { data: existing, error: fetchErr } = await supabase
          .from('leads')
          .select('id')
          .eq('phone', phone)
          .maybeSingle();

        if (fetchErr) {
          console.error(`Supabase fetch error for phone ${phone}:`, fetchErr.message);
          // Continue anyway, but log
        }

        if (existing) {
          // Update last_seen and skip
          const { error: updateErr } = await supabase
            .from('leads')
            .update({ last_seen: new Date().toISOString() })
            .eq('phone', phone);

          if (updateErr) {
            console.error(`Supabase update last_seen error for phone ${phone}:`, updateErr.message);
          }

          result.skipped_dedup++;
          continue;
        }

        // Step 5: Score
        const { score, reason } = await scoreLead(website);

        // Step 6: Track if score too low, but DO NOT skip storing it
        if (score <= 50) {
          result.skipped_score++;
        }

        // Step 7: Store
        const { error: insertErr } = await supabase
          .from('leads')
          .insert({
            name: biz.name,
            phone,
            website,
            score,
            reason,
            source: query,
            called: false,
            called_at: null,
            last_seen: new Date().toISOString(),
          });

        if (insertErr) {
          console.error(`Supabase upsert error for lead ${biz.name}:`, insertErr.message);
          continue; // Continue to next lead
        }

        result.stored++;
      } catch (leadErr) {
        // Individual lead processing failure should not crash the entire pipeline
        console.error(`Error processing individual lead:`, leadErr);
      }
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Pipeline error:', error);
    return NextResponse.json({ error: error.message || 'Pipeline route failed' }, { status: 500 });
  }
}
