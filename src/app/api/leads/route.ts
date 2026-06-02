import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifySession } from '@/lib/authGuard';

// GET — fetch leads, score high to low first, uncalled only by default unless called is specified
export async function GET(req: NextRequest) {
  try {
    // Enforce active approved session authority
    await verifySession(req);
    const { searchParams } = new URL(req.url);
    
    // Pagination parameters
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Number(searchParams.get('limit')) || 10);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Filters and Sorting
    const showAll = searchParams.get('showAll') === 'true';
    const intent = searchParams.get('intent') || 'all'; // 'high' | 'low' | 'all'
    const calledParam = searchParams.get('called'); // 'true' | 'false' | null
    const tierParam = searchParams.get('tier'); // 'hot' | 'warm' | 'nurture' | 'cold' | 'all' | null
    const nicheParam = searchParams.get('niche'); // 'all' | clinic, real_estate, gym, restaurant, consultant, education, retail
    const cityParam = searchParams.get('city'); // 'all' | premium, metro, tier2
    const sortBy = searchParams.get('sortBy') || 'final_score';
    const searchFilter = searchParams.get('searchFilter'); // historic source tag
    const searchVal = searchParams.get('search')?.trim(); // active search input

    // Selective Columns to reduce payload size
    const selectFields = [
      'id',
      'name',
      'phone',
      'website',
      'score',
      'reason',
      'source',
      'called',
      'called_at',
      'created_at',
      'address',
      'rating',
      'reviews',
      'maps_url',
      'crm_status',
      'notes',
      'follow_up_at',
      'deal_value',
      'email',
      'meeting_notes',
      'meeting_link',
      'revenue_score',
      'contact_score',
      'final_score',
      'problems',
      'tier',
      'intent_score',
      'digital_gap_score'
    ].join(',');

    let query = supabase
      .from('leads')
      .select(selectFields, { count: 'planned' });

    // 1. Called Filter
    if (calledParam === 'true') {
      query = query.eq('called', true);
    } else if (calledParam === 'false') {
      query = query.eq('called', false);
    } else if (!showAll) {
      query = query.eq('called', false);
    }

    // 2. Intent Filter
    if (intent === 'high') {
      query = query.gt('score', 50);
    } else if (intent === 'low') {
      query = query.lte('score', 50);
    }

    // 3. Tier Filter
    if (tierParam && tierParam !== 'all') {
      query = query.eq('tier', tierParam);
    }

    // 4. Search Filter (historical tag)
    if (searchFilter) {
      query = query.eq('source', searchFilter);
    }

    // 5. Active search GIN optimization
    if (searchVal) {
      // Matches (name || ' ' || website) logic or simple fields
      query = query.or(
        `name.ilike.%${searchVal}%,phone.ilike.%${searchVal}%,source.ilike.%${searchVal}%,website.ilike.%${searchVal}%`
      );
    }

    // 6. Niche Filter (Server-side translation)
    if (nicheParam && nicheParam !== 'all') {
      const nicheKeywords: Record<string, string[]> = {
        clinic: ['dentist', 'dental', 'clinic', 'hospital', 'doctor', 'medical'],
        real_estate: ['real estate', 'builder', 'property', 'flat', 'apartment'],
        gym: ['gym', 'fitness', 'yoga', 'wellness', 'spa', 'salon', 'beauty'],
        restaurant: ['restaurant', 'cafe', 'food', 'dhaba', 'biryani', 'dining'],
        consultant: ['lawyer', 'advocate', 'ca', 'chartered', 'consultant', 'tax'],
        education: ['school', 'college', 'coaching', 'tuition', 'academy'],
        retail: ['shop', 'store', 'retail', 'boutique', 'mart']
      };
      
      const keywords = nicheKeywords[nicheParam];
      if (keywords) {
        const orClauses = keywords.map(kw => `name.ilike.%${kw}%,source.ilike.%${kw}%`).join(',');
        query = query.or(orClauses);
      }
    }

    // 7. City Filter (Server-side translation)
    if (cityParam && cityParam !== 'all') {
      const premiumKeywords = ['bandra','koramangala','juhu','powai','worli','lower parel','indiranagar','south mumbai','andheri west','hiranandani','khan market','hauz khas','whitefield','connaught place'];
      const metroKeywords = ['mumbai','delhi','bengaluru','bangalore','hyderabad','chennai','pune','kolkata','ahmedabad','gurgaon','gurugram','noida','surat','jaipur'];
      const tier2Keywords = ['nagpur','indore','lucknow','bhopal','vadodara','coimbatore','kochi','patna','chandigarh','visakhapatnam','vizag','mysuru','mysore','rajkot','nashik','aurangabad'];
      
      let keywords: string[] = [];
      if (cityParam === 'premium') keywords = premiumKeywords;
      else if (cityParam === 'metro') keywords = metroKeywords;
      else if (cityParam === 'tier2') keywords = tier2Keywords;

      if (keywords.length > 0) {
        const orClauses = keywords.map(kw => `address.ilike.%${kw}%`).join(',');
        query = query.or(orClauses);
      }
    }

    // 8. Sorting
    if (calledParam === 'true' && sortBy === 'final_score') {
      // Default CRM sorting
      query = query.order('called_at', { ascending: false });
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'deal_value') {
      query = query.order('deal_value', { ascending: false });
    } else if (sortBy === 'priority_rank') {
      query = query.order('priority_rank', { ascending: true });
    } else if (sortBy === 'intent_score') {
      query = query.order('intent_score', { ascending: false });
    } else if (sortBy === 'digital_gap_score') {
      query = query.order('digital_gap_score', { ascending: false });
    } else {
      // default prospects sorting
      query = query.order('score', { ascending: false });
    }

    // Paginate via range
    const { data, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate aggregated CRM Statistics for all called leads in database (not sliced)
    let stats = null;
    if (calledParam === 'true') {
      const { data: statsData } = await supabase
        .from('leads')
        .select('crm_status, deal_value, follow_up_at')
        .eq('called', true);

      if (statsData) {
        const activeDeals = statsData.filter(l => l.crm_status !== 'lost' && l.crm_status !== 'won');
        const pipelineValue = activeDeals.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

        const wonDeals = statsData.filter(l => l.crm_status === 'won');
        const wonRevenue = wonDeals.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

        const lostDeals = statsData.filter(l => l.crm_status === 'lost');
        const totalClosed = wonDeals.length + lostDeals.length;
        const closeRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;

        const pendingFollowUps = statsData.filter(l => {
          if (!l.follow_up_at || l.crm_status === 'won' || l.crm_status === 'lost') return false;
          const date = new Date(l.follow_up_at);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const compDate = new Date(date);
          compDate.setHours(0, 0, 0, 0);
          return compDate.getTime() <= today.getTime();
        }).length;

        stats = {
          pipelineValue,
          wonRevenue,
          closeRate,
          pendingFollowUps,
          activeCount: activeDeals.length,
          wonCount: wonDeals.length,
          closedCount: totalClosed
        };
      }
    } else {
      // Calculate aggregated Prospects Statistics for all uncalled leads in database (not sliced)
      const { data: statsData } = await supabase
        .from('leads')
        .select('score, tier, intent_score, called')
        .eq('called', false);

      if (statsData) {
        const total = statsData.length;
        const pendingCalls = statsData.filter(l => !l.called).length;
        const hotProspects = statsData.filter(l => (Number(l.score) || 0) >= 70).length;
        const avgQuality = total > 0 ? Math.round(statsData.reduce((acc, l) => acc + (Number(l.score) || 0), 0) / total) : 0;
        const hotLeads = statsData.filter(l => l.tier === 'hot').length;
        
        const validIntent = statsData.filter(l => l.intent_score !== undefined && l.intent_score !== null);
        const avgIntent = validIntent.length > 0 ? Math.round(validIntent.reduce((acc, l) => acc + (Number(l.intent_score) || 0), 0) / validIntent.length) : 0;

        stats = {
          total,
          pendingCalls,
          hotProspects,
          avgQuality,
          hotLeads,
          avgIntent
        };
      }
    }

    return NextResponse.json({
      leads: data || [],
      count: count || 0,
      stats
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

// PATCH — mark a lead as called or update CRM fields
export async function PATCH(req: NextRequest) {
  try {
    // Enforce active approved session authority
    await verifySession(req);
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
    return NextResponse.json(
      { error: error.message || 'Failed to update lead' },
      { status: error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
