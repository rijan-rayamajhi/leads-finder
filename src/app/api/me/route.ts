import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuthUser } from '@/lib/authGuard';

// GET — Sync and fetch current user profile details
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user JWT from client
    const user = await verifyAuthUser(req);
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
    const isSuperAdmin = user.email?.toLowerCase() === superAdminEmail.toLowerCase();

    // 2. Fetch existing profile from database
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();


    let profile = existingProfile;

    if (!profile) {
      // 3a. Profile does not exist: create it cleanly
      const newProfilePayload = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        role: isSuperAdmin ? 'super_admin' : 'user',
        status: isSuperAdmin ? 'approved' : 'pending',
      };

      const { data: insertedProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfilePayload)
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: `Failed to create profile: ${insertError.message}` }, { status: 500 });
      }
      profile = insertedProfile;
    } else {
      // 3b. Profile exists: update user metadata (name, avatar) and self-heal Super Admin permissions if env configured
      const updatePayload: Record<string, unknown> = {
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || profile.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || profile.avatar_url || '',
        updated_at: new Date().toISOString(),
      };


      // Force bootstrap role if email matches the current SUPER_ADMIN_EMAIL config
      if (isSuperAdmin && (profile.role !== 'super_admin' || profile.status !== 'approved')) {
        updatePayload.role = 'super_admin';
        updatePayload.status = 'approved';
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: `Failed to update profile: ${updateError.message}` }, { status: 500 });
      }
      profile = updatedProfile;
    }

    return NextResponse.json(profile);
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Failed to authenticate user' },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
