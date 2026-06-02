import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/authGuard';

// GET — Fetch all registered user profiles (Super Admin only)
export async function GET(req: NextRequest) {
  try {
    // 1. Enforce super admin authority
    await verifyAdmin(req);

    // 2. Fetch all user profiles from DB
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profiles);
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message.includes('Forbidden') ? 403 : 401 }
    );
  }
}

// PATCH — Modify a user profile status (Super Admin only)
export async function PATCH(req: NextRequest) {
  try {
    // 1. Enforce super admin authority
    const admin = await verifyAdmin(req);

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing target user id or status' }, { status: 400 });
    }

    const validStatuses = ['approved', 'rejected', 'disabled', 'blocked'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid user status value' }, { status: 400 });
    }

    // 2. Fetch target user to inspect current details
    const { data: targetUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'Target user profile not found' }, { status: 404 });
    }

    // 3. Lockout Protection: Do not allow modifying the primary super admin's account
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
    if (targetUser.email.toLowerCase() === superAdminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden: Cannot modify the primary Super Admin account' }, { status: 403 });
    }

    // 4. Update the target user's status in profiles database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 5. Create a transaction audit log for safety
    const auditPayload = {
      action_by: admin.id,
      action_by_email: admin.email,
      target_user: targetUser.id,
      target_user_email: targetUser.email,
      action: status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : status === 'disabled' ? 'disable' : 'block',
      details: `Status changed from '${targetUser.status}' to '${status}' by super admin.`,
    };

    const { error: logError } = await supabase
      .from('audit_logs')
      .insert(auditPayload);

    if (logError) {
      console.error('Failed to write audit log details:', logError.message);
      // We don't fail the request if just the logging fails, but we print to console
    }

    return NextResponse.json({ success: true, status });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message.includes('Forbidden') ? 403 : 401 }
    );
  }
}
