import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — fetch leads, score high to low first, uncalled only by default
export async function GET(req: NextRequest) {
  try {
    // Step 0: Auto-delete leads older than 7 days to keep database clean
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: deleteErr } = await supabase
      .from('leads')
      .delete()
      .lt('created_at', sevenDaysAgo);

    if (deleteErr) {
      console.error('Error performing auto-deletion of old leads:', deleteErr.message);
    }

    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('showAll') === 'true';
    const intent = searchParams.get('intent') || 'high'; // 'high' | 'low' | 'all'

    let query = supabase
      .from('leads')
      .select('*')
      .order('score', { ascending: false })
      .limit(100);

    if (!showAll) {
      query = query.eq('called', false);
    }

    if (intent === 'high') {
      query = query.gt('score', 50);
    } else if (intent === 'low') {
      query = query.lte('score', 50);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Failed to fetch leads' }, { status: 500 });
  }
}

// PATCH — mark a lead as called
export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('leads')
      .update({
        called: true,
        called_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Failed to update lead' }, { status: 500 });
  }
}
