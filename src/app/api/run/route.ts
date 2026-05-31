import { NextRequest, NextResponse } from 'next/server';
import { scrapeBusinesses } from '@/lib/scraper';
import { scoreLead } from '@/lib/scorer';
import { normalizePhone, normalizeWebsite } from '@/lib/deduplicator';
import { supabase } from '@/lib/supabase';
import { PipelineResult } from '@/types/lead';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          // Auto-delete leads older than 7 days
          sendEvent({ status: 'progress', message: '🧹 Cleaning database (removing leads older than 7 days)...' });
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const { error: deleteErr } = await supabase
            .from('leads')
            .delete()
            .lt('created_at', sevenDaysAgo);

          if (deleteErr) {
            console.error('Error performing auto-deletion of old leads:', deleteErr.message);
          }

          // Step 1: Scrape
          sendEvent({ status: 'progress', message: `🔍 Searching Google Places for "${query.trim()}"...` });
          const businesses = await scrapeBusinesses(query);
          
          const result: PipelineResult = {
            scraped: businesses.length,
            filtered: 0,
            stored: 0,
            skipped_dedup: 0,
            skipped_score: 0,
          };

          sendEvent({ 
            status: 'progress', 
            message: `📋 Found ${businesses.length} business candidates. Checking phone numbers & duplicates...` 
          });

          for (const biz of businesses) {
            try {
              // Step 2: Filter — skip if no phone
              if (!biz.phone) {
                sendEvent({ status: 'progress', message: `⚠️ Skipping "${biz.name}": No phone number found.` });
                continue;
              }
              result.filtered++;

              // Step 3: Normalize
              const phone = normalizePhone(biz.phone);
              const website = normalizeWebsite(biz.website);

              if (!phone) {
                sendEvent({ status: 'progress', message: `⚠️ Skipping "${biz.name}": Invalid phone format.` });
                continue;
              }

              // Step 4: Dedup check — skip if phone already exists
              const { data: existing, error: fetchErr } = await supabase
                .from('leads')
                .select('id')
                .eq('phone', phone)
                .maybeSingle();

              if (fetchErr) {
                console.error(`Supabase fetch error for phone ${phone}:`, fetchErr.message);
              }

              if (existing) {
                // Update last_seen and skip
                await supabase
                  .from('leads')
                  .update({ last_seen: new Date().toISOString() })
                  .eq('phone', phone);

                sendEvent({ 
                  status: 'progress', 
                  message: `🔄 Updating "${biz.name}" (Duplicate lead; refreshed last_seen in database)...` 
                });
                result.skipped_dedup++;
                continue;
              }

              // Step 5: Score
              sendEvent({ 
                status: 'progress', 
                message: `🧠 Auditing web presence for "${biz.name}" (Website: ${biz.website || 'None'})...` 
              });
              const { score, reason } = await scoreLead(website);

              // Step 6: Track if score too low
              if (score <= 50) {
                sendEvent({ 
                  status: 'progress', 
                  message: `📉 Skipping "${biz.name}" (Score too low: ${score} - ${reason}).` 
                });
                result.skipped_score++;
                continue;
              }

              // Pack audit text and Google Places metadata into a single JSON in the reason column
              const packedReason = JSON.stringify({
                text: reason,
                address: biz.address || null,
                rating: biz.rating || null,
                reviews: biz.reviews || null,
                maps_url: biz.maps_url || null,
              });

              // Step 7: Store
              sendEvent({ 
                status: 'progress', 
                message: `💾 Storing hot prospect "${biz.name}" in database (Score: ${score})...` 
              });
              const { error: insertErr } = await supabase
                .from('leads')
                .insert({
                  name: biz.name,
                  phone,
                  website,
                  score,
                  reason: packedReason,
                  source: query,
                  called: false,
                  called_at: null,
                  last_seen: new Date().toISOString(),
                });

              if (insertErr) {
                console.error(`Supabase upsert error for lead ${biz.name}:`, insertErr.message);
                sendEvent({ status: 'progress', message: `❌ Database insert failed for "${biz.name}".` });
                continue;
              }

              result.stored++;
            } catch (leadErr) {
              console.error(`Error processing individual lead:`, leadErr);
            }
          }

          // Step 8: Log to search history
          try {
            const trimmedQuery = query.trim();
            const { data: existingHist } = await supabase
              .from('search_history')
              .select('run_count')
              .eq('query', trimmedQuery)
              .maybeSingle();

            const newRunCount = existingHist ? (existingHist.run_count || 0) + 1 : 1;

            await supabase
              .from('search_history')
              .upsert({
                query: trimmedQuery,
                last_run_at: new Date().toISOString(),
                run_count: newRunCount,
                last_stored: result.stored,
              }, { onConflict: 'query' });
          } catch (histErr) {
            console.error('Error logging search history:', histErr);
          }

          // Send complete event
          sendEvent({ status: 'complete', result });
          controller.close();
        } catch (err: unknown) {
          const error = err as Error;
          sendEvent({ status: 'error', message: error.message || 'Streaming pipeline failed' });
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Pipeline error:', error);
    return NextResponse.json({ error: error.message || 'Pipeline route failed' }, { status: 500 });
  }
}
