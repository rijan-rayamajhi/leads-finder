import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — fetch leads, score high to low first, uncalled only by default unless called is specified
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('showAll') === 'true';
    const intent = searchParams.get('intent') || 'all'; // 'high' | 'low' | 'all'
    const calledParam = searchParams.get('called'); // 'true' | 'false' | null
    const tierParam = searchParams.get('tier'); // 'hot' | 'warm' | 'nurture' | 'cold' | 'all' | null

    let query = supabase
      .from('leads')
      .select('*');

    // If fetching for CRM, order by called_at desc so latest called is first
    if (calledParam === 'true') {
      query = query.eq('called', true).order('called_at', { ascending: false });
    } else {
      query = query.order('score', { ascending: false });
      if (calledParam === 'false') {
        query = query.eq('called', false);
      } else if (!showAll) {
        query = query.eq('called', false);
      }
    }

    if (intent === 'high') {
      query = query.gt('score', 50);
    } else if (intent === 'low') {
      query = query.lte('score', 50);
    }

    // Tier filtering (Phase B4)
    if (tierParam && tierParam !== 'all') {
      query = query.eq('tier', tierParam);
    }

    // Limit to 200 for CRM view to allow seeing more called leads
    const limitAmount = calledParam === 'true' ? 200 : 100;
    query = query.limit(limitAmount);

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

// PATCH — mark a lead as called or update CRM fields
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Build update payload dynamically
    const updatePayload: Record<string, unknown> = {};

    if (body.called !== undefined) {
      updatePayload.called = body.called;
      if (body.called) {
        updatePayload.called_at = new Date().toISOString();
        updatePayload.crm_status = body.crm_status || 'no_answer';
      } else {
        updatePayload.called_at = null;
        updatePayload.crm_status = null;
        updatePayload.follow_up_at = null;
        updatePayload.deal_value = 0;
        updatePayload.notes = '';
      }
    }

    if (body.crm_status !== undefined) {
      updatePayload.crm_status = body.crm_status;
    }
    if (body.notes !== undefined) {
      updatePayload.notes = body.notes;
    }
    if (body.follow_up_at !== undefined) {
      updatePayload.follow_up_at = body.follow_up_at;
    }
    if (body.deal_value !== undefined) {
      updatePayload.deal_value = body.deal_value === null ? null : (Number(body.deal_value) || 0);
    }
    if (body.phone !== undefined) {
      updatePayload.phone = body.phone;
    }
    if (body.website !== undefined) {
      updatePayload.website = body.website;
    }
    if (body.email !== undefined) {
      updatePayload.email = body.email;
    }
    if (body.meeting_notes !== undefined) {
      updatePayload.meeting_notes = body.meeting_notes;
    }
    if (body.meeting_link !== undefined) {
      updatePayload.meeting_link = body.meeting_link;
    }

    // If payload is empty (legacy simple mark called), default to marking as called
    if (Object.keys(updatePayload).length === 0) {
      updatePayload.called = true;
      updatePayload.called_at = new Date().toISOString();
      updatePayload.crm_status = 'no_answer';
    }

    const { error } = await supabase
      .from('leads')
      .update(updatePayload)
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
