import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase with Service Role Key
    const serviceKey = Deno.env.get('PROD_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey ?? ''
    );

    // 2. Validate User Session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError }), { status: 401, headers: corsHeaders });
    }

    const userId = user.id;
    console.log(`[delete-account] Starting deletion for user: ${userId}`);

    // --- TRACKING STATS FOR FRONTEND ---
    const stats = {
        reports: 0,
        blocks: 0,
        posts: 0,
        comments: 0,
        likes: 0,
        storageFiles: 0,
        attendanceAnonymized: false
    };

    // --- STEP 1: Storage Cleanup (NEW) ---
    // We clean storage first while we still have the user info
    
    // A. Resumes ({userId}/resume.pdf)
    const { data: resumeFiles } = await supabase.storage.from('resumes').list(userId);
    if (resumeFiles && resumeFiles.length > 0) {
        const filesToRemove = resumeFiles.map(f => `${userId}/${f.name}`);
        const { data: removed } = await supabase.storage.from('resumes').remove(filesToRemove);
        stats.storageFiles += removed?.length || 0;
    }

    // B. User Uploads / Profile Pics ({userId}/profile/*)
    const { data: profileFiles } = await supabase.storage.from('user-uploads').list(`${userId}/profile`);
    if (profileFiles && profileFiles.length > 0) {
        const filesToRemove = profileFiles.map(f => `${userId}/profile/${f.name}`);
        const { data: removed } = await supabase.storage.from('user-uploads').remove(filesToRemove);
        stats.storageFiles += removed?.length || 0;
    }
    
    console.log(`[delete-account] Storage cleaned: ${stats.storageFiles} files.`);


    // --- STEP 2: Database Cleanup ---

    // Reports (Fixing "Resolved By" constraint first)
    await supabase.from('reports').update({ resolved_by: null }).eq('resolved_by', userId);
    const { count: reportCount } = await supabase.from('reports').delete({ count: 'exact' })
       .or(`reporter_id.eq.${userId},target_id.eq.${userId}`);
    stats.reports = reportCount || 0;

    // User Blocks
    const { count: blockCount } = await supabase.from('user_blocks').delete({ count: 'exact' })
       .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    stats.blocks = blockCount || 0;

    // Feed Activity
    const { count: postCount } = await supabase.from('feed_posts').delete({ count: 'exact' }).eq('user_id', userId);
    stats.posts = postCount || 0;

    const { count: commentCount } = await supabase.from('feed_comments').delete({ count: 'exact' }).eq('user_id', userId);
    stats.comments = commentCount || 0;

    const { count: likeCount } = await supabase.from('feed_likes').delete({ count: 'exact' }).eq('user_id', userId);
    stats.likes = likeCount || 0;

    // Points & Meta (No need to count these generally)
    await supabase.from('admin_roles').delete().eq('user_id', userId);
    await supabase.from('committee_members').delete().eq('user_id', userId);
    await supabase.from('points_transactions').delete().eq('user_id', userId);
    await supabase.from('points_balances').delete().eq('user_id', userId);
    
    // Anonymize Attendance
    await supabase.from('event_attendance')
      .update({ user_id: null, answers: null })
      .eq('user_id', userId);
    stats.attendanceAnonymized = true;

    // Delete Profile
    await supabase.from('user_profiles').delete().eq('id', userId);

    // --- STEP 3: Auth User Deletion ---
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[delete-account] Auth user deletion error:', deleteError);
      return new Response(
          JSON.stringify({ 
              success: false, 
              error: 'AUTH_DELETE_FAILED', 
              code: '500', 
              details: deleteError 
          }), 
          { status: 500, headers: corsHeaders }
      );
    }

    // --- SUCCESS: Return the Summary ---
    console.log('[delete-account] Success. Summary:', stats);
    
    return new Response(JSON.stringify({ 
        success: true,
        deletionSummary: stats // <--- Matches Frontend expectation
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('[delete-account] Unexpected error:', error);
    return new Response(JSON.stringify({ 
        success: false, 
        error: 'Internal Server Error', 
        code: '500',
        details: error
    }), { status: 500, headers: corsHeaders });
  }
});