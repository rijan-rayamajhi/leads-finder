import { NextRequest, NextResponse } from 'next/server';
import { scrapeBusinesses } from '@/lib/scraper';
import { scoreLead, isDisqualified } from '@/lib/scorer';
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

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          // Auto-delete leads older than 7 days, restricting to uncalled leads only
          sendEvent({ 
            status: 'progress', 
            progress: 5,
            active_biz: 'Cleaning database entries older than 7 days...',
            message: '🧹 Cleaning database (removing leads older than 7 days)...' 
          });
          await sleep(250); // Yield to flush stream buffer

          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const { error: deleteErr } = await supabase
            .from('leads')
            .delete()
            .lt('created_at', sevenDaysAgo)
            .eq('called', false);

          if (deleteErr) {
            console.error('Error performing auto-deletion of old leads:', deleteErr.message);
          }

          // Step 1: Scrape
          sendEvent({ 
            status: 'progress', 
            progress: 15,
            active_biz: `Searching Google Places for "${query.trim()}"...`,
            message: `🔍 Searching Google Places for "${query.trim()}"...` 
          });
          await sleep(250); // Yield to flush stream buffer

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
            progress: 30,
            active_biz: `Found ${businesses.length} candidates. Initiating web audits...`,
            message: `📋 Found ${businesses.length} business candidates. Checking phone numbers & duplicates...` 
          });
          await sleep(250); // Yield to flush stream buffer

          let currentIndex = 0;
          const totalBiz = businesses.length;
          for (const biz of businesses) {
            try {
              const progress = totalBiz > 0 ? Math.round(30 + ((currentIndex + 1) / totalBiz) * 70) : 30;
              currentIndex++;

              // Step 2: Filter — skip if no phone
              if (!biz.phone) {
                sendEvent({ 
                  status: 'progress', 
                  progress,
                  active_biz: biz.name,
                  message: `⚠️ Skipping "${biz.name}": No phone number found.` 
                });
                await sleep(100); // Yield to prevent sequential batching of skipped elements
                continue;
              }
              result.filtered++;

              // Step 3: Normalize
              const phone = normalizePhone(biz.phone);
              const website = normalizeWebsite(biz.website);

              if (!phone) {
                sendEvent({ 
                  status: 'progress', 
                  progress,
                  active_biz: biz.name,
                  message: `⚠️ Skipping "${biz.name}": Invalid phone format.` 
                });
                await sleep(100); // Yield
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
                  progress,
                  active_biz: biz.name,
                  message: `🔄 Updating "${biz.name}" (Duplicate lead; refreshed last_seen in database)...` 
                });
                await sleep(100); // Yield to prevent sequential batching of skipped elements
                result.skipped_dedup++;
                continue;
              }

              // Step 4.5: Disqualifier Check
              const leadData = {
                name: biz.name,
                phone: biz.phone,
                website: biz.website || undefined,
                address: biz.address || undefined,
                rating: biz.rating || undefined,
                reviews: biz.reviews || undefined,
                query: query,
                reviewsList: biz.reviews_list ? biz.reviews_list.map((r: { text?: string; author_name?: string }) => ({ text: r.text || '', author_name: r.author_name || '' })) : undefined,
                business_status: biz.business_status,
                types: biz.types,
                photos: biz.photos,
                opening_hours: biz.opening_hours || undefined,
              };

              const dqCheck = isDisqualified(leadData);
              if (dqCheck.disqualified) {
                sendEvent({
                  status: 'progress',
                  progress,
                  active_biz: biz.name,
                  type: 'log',
                  message: `⏭ Skipped ${leadData.name} — ${dqCheck.reason}`
                });
                await sleep(100); // Yield to prevent sequential batching of skipped elements
                continue;
              }

              // Step 5: Score
              sendEvent({ 
                status: 'progress', 
                progress,
                active_biz: biz.name,
                message: `🧠 Auditing web presence for "${biz.name}" (Website: ${biz.website || 'None'})...` 
              });
              const scoring = await scoreLead(website, leadData);

              // Step 6: Track if score too low (Store ONLY if (opportunityScore >= 40 AND revenueScore >= 30) OR (revenueScore >= 50 AND problems.primary !== 'none'))
              const meetsStandardFilter = scoring.opportunityScore >= 40 && scoring.revenueScore >= 30;
              const meetsHighRevenueFilter = scoring.revenueScore >= 50 && scoring.problems?.primary && scoring.problems.primary !== 'none';

              if (!meetsStandardFilter && !meetsHighRevenueFilter) {
                sendEvent({ 
                  status: 'progress', 
                  progress,
                  active_biz: biz.name,
                  message: `📉 Skipping "${biz.name}" (Opportunity: ${scoring.opportunityScore}/40, Revenue: ${scoring.revenueScore}/30, Primary Problem: ${scoring.problems?.primary}).` 
                });
                await sleep(100); // Yield to prevent sequential batching of skipped elements
                result.skipped_score++;
                continue;
              }

              // Pack audit text and Google Places metadata into a single JSON in the reason column
              const packedReason = JSON.stringify({
                text: scoring.problems.list.join(', '),
                address: biz.address || null,
                rating: biz.rating || null,
                reviews: biz.reviews || null,
                maps_url: biz.maps_url || null,
              });

              // Step 7: Store
              sendEvent({ 
                status: 'progress', 
                progress,
                active_biz: biz.name,
                message: `💾 Storing hot prospect "${biz.name}" in database (Score: ${scoring.finalScore})...` 
              });
              const { error: insertErr } = await supabase
                .from('leads')
                .insert({
                  name: biz.name,
                  phone,
                  website,
                  score: scoring.finalScore,
                  reason: packedReason,
                  source: query,
                  called: false,
                  called_at: null,
                  last_seen: new Date().toISOString(),
                  revenue_score: scoring.revenueScore,
                  contact_score: scoring.contactScore,
                  final_score: scoring.finalScore,
                  segment: scoring.segment,
                  estimated_loss: scoring.estimated_loss,
                  recommended_service: scoring.recommended_service,
                  outreach_context: scoring.outreach_context,
                  priority_rank: scoring.priority_rank,
                  conversion_probability: scoring.conversion_probability,
                  
                  // Upgraded Scoring & Tier Columns (Phase B3)
                  intent_score:      scoring.intentScore ?? 0,
                  digital_gap_score: scoring.digitalGapNorm ?? 0,
                  tier:              scoring.tier ?? 'cold',
                  
                  // Store email if extracted by analyzer
                  ...(scoring.extractedEmail && { 
                    email: scoring.extractedEmail 
                  }),
                  
                  // Store digital gap norm inside existing problems JSONB
                  problems: {
                    ...scoring.problems,
                    intentNorm:    scoring.intentNorm,
                    digitalGapNorm: scoring.digitalGapNorm,
                    hasPhotos:     (biz.photos?.length ?? 0) > 0,
                    hasSevenDays:  biz.opening_hours?.weekday_text?.length === 7
                  }
                });

              if (insertErr) {
                console.error(`Supabase upsert error for lead ${biz.name}:`, insertErr.message);
                sendEvent({ 
                  status: 'progress', 
                  progress,
                  active_biz: biz.name,
                  message: `❌ Database insert failed for "${biz.name}".` 
                });
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
