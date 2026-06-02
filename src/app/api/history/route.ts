import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifySession } from '@/lib/authGuard';

// GET — fetch search query history, most recently run first
export async function GET(req: NextRequest) {
  try {
    // Enforce active approved session authority
    await verifySession(req);
    const { data: history, error: historyErr } = await supabase
      .from('search_history')
      .select('*')
      .order('last_run_at', { ascending: false });

    if (historyErr) {
      return NextResponse.json({ error: historyErr.message }, { status: 500 });
    }

    // Fetch all leads to group by source and calculate statistics on-the-fly
    const { data: leads, error: leadsErr } = await supabase
      .from('leads')
      .select('source, score, tier');

    if (leadsErr) {
      console.error('Failed to fetch leads for history stats:', leadsErr.message);
      return NextResponse.json(history || []);
    }

    const statsMap: Record<string, { count: number; totalScore: number; hotCount: number }> = {};
    if (leads) {
      for (const lead of leads) {
        const src = (lead.source || '').trim().toLowerCase();
        if (!statsMap[src]) {
          statsMap[src] = { count: 0, totalScore: 0, hotCount: 0 };
        }
        statsMap[src].count++;
        statsMap[src].totalScore += lead.score || 0;
        if (lead.tier === 'hot') {
          statsMap[src].hotCount++;
        }
      }
    }

    const enrichedHistory = (history || []).map((item) => {
      const srcKey = (item.query || '').trim().toLowerCase();
      const stats = statsMap[srcKey] || { count: 0, totalScore: 0, hotCount: 0 };
      return {
        ...item,
        live_count: stats.count,
        avg_score: stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0,
        hot_count: stats.hotCount,
      };
    });

    return NextResponse.json(enrichedHistory);
  } catch (err: unknown) {
    const error = err as Error;
    const isAuthError = error.message.includes('Unauthorized') || error.message.includes('Forbidden');
    if (!isAuthError) {
      console.error('History GET error:', error);
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch search history' },
      { status: error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

// DELETE — delete search query history (single item or all)
export async function DELETE(req: NextRequest) {
  try {
    // Enforce active approved session authority
    await verifySession(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all') === 'true';

    if (all) {
      // Clear all history
      const { error } = await supabase
        .from('search_history')
        .delete()
        .neq('id', 0); // deletes all rows

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'All search history cleared' });
    }

    if (!id) {
      return NextResponse.json({ error: 'id or all=true is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `History item deleted` });
  } catch (err: unknown) {
    const error = err as Error;
    const isAuthError = error.message.includes('Unauthorized') || error.message.includes('Forbidden');
    if (!isAuthError) {
      console.error('History DELETE error:', error);
    }
    return NextResponse.json(
      { error: error.message || 'Failed to delete search history' },
      { status: error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
