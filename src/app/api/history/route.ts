import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — fetch search query history, most recently run first
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .order('last_run_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('History GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch search history' }, { status: 500 });
  }
}

// DELETE — delete search query history (single item or all)
export async function DELETE(req: NextRequest) {
  try {
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
    console.error('History DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete search history' }, { status: 500 });
  }
}
