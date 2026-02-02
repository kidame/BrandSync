import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApifyResultsInput {
  job_id: string;
  apify_run_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('APIFY_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Apify API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { job_id, apify_run_id }: ApifyResultsInput = await req.json();

    if (!job_id || !apify_run_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'job_id and apify_run_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching results for run ${apify_run_id}`);

    // Check run status
    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${apify_run_id}?token=${apiKey}`
    );

    if (!statusResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to get run status: ${statusResponse.status}` }),
        { status: statusResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusData = await statusResponse.json();
    const runStatus = statusData.data?.status;

    console.log('Run status:', runStatus);

    if (runStatus === 'RUNNING' || runStatus === 'READY') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'running',
          message: 'Scraping job is still running',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
      const jobConfig = (await supabase.from('scraping_jobs').select('config').eq('id', job_id).single()).data?.config as { linkedin_search_id?: string } | undefined;
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          error_message: `Run ${runStatus}`,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job_id);
      if (jobConfig?.linkedin_search_id) {
        await supabase
          .from('linkedin_job_searches')
          .update({
            status: 'failed',
            error_message: `Run ${runStatus}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobConfig.linkedin_search_id);
      }

      return new Response(
        JSON.stringify({ success: false, status: 'failed', error: `Run ${runStatus}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch results from dataset
    const datasetId = statusData.data?.defaultDatasetId;
    if (!datasetId) {
      return new Response(
        JSON.stringify({ success: false, error: 'No dataset found for run' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resultsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}&limit=1000`
    );

    if (!resultsResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch results: ${resultsResponse.status}` }),
        { status: resultsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = await resultsResponse.json();

    // LinkedIn jobs: persist to linkedin_job_offers + linkedin_companies and update linkedin_job_searches
    const jobRecord = (await supabase.from('scraping_jobs').select('source, config').eq('id', job_id).single()).data;
    const linkedinSearchId = jobRecord?.config?.linkedin_search_id as string | undefined;
    if (jobRecord?.source === 'linkedin_jobs' && linkedinSearchId && Array.isArray(results) && results.length > 0) {
      const territoryId = (await supabase.from('scraping_jobs').select('territory_id').eq('id', job_id).single()).data?.territory_id;
      if (territoryId) {
        const normalizeCompanyName = (s: string) => (typeof s === 'string' ? s.trim() : '');
        const normalizeLinkedInUrl = (s: string): string | null => {
          const t = typeof s === 'string' ? s.trim() : '';
          return t || null;
        };
        const companyIdsByKey = new Map<string, string>();
        for (const item of results as Record<string, unknown>[]) {
          const rawName = (item.companyName ?? item.company ?? item.companyNameFromProfile ?? '') as string;
          const rawUrl = (item.companyUrl ?? item.companyLink ?? item.companyLinkedInUrl ?? '') as string;
          const companyName = normalizeCompanyName(rawName);
          const companyUrl = normalizeLinkedInUrl(rawUrl);
          const key = `${companyName}|${companyUrl ?? ''}`.toLowerCase();
          if (!companyIdsByKey.has(key) && companyName) {
            const website = (item.companyWebsite ?? item.website ?? '') as string;
            const { data: existing } = await supabase
              .from('linkedin_companies')
              .select('id')
              .eq('territory_id', territoryId)
              .eq('name', companyName)
              .eq('linkedin_url', companyUrl)
              .maybeSingle();
            if (existing?.id) {
              companyIdsByKey.set(key, existing.id);
            } else {
              const { data: inserted } = await supabase
                .from('linkedin_companies')
                .insert({
                  territory_id: territoryId,
                  name: companyName,
                  linkedin_url: companyUrl,
                  website_url: (typeof website === 'string' ? website.trim() : '') || null,
                })
                .select('id')
                .single();
              if (inserted?.id) companyIdsByKey.set(key, inserted.id);
            }
          }
        }
        // Plusieurs acteurs LinkedIn utilisent des noms de champs différents pour la description
        // Apify LinkedIn : descriptionText, descriptionHtml
        const getJobDescription = (item: Record<string, unknown>): string | null => {
          const raw = (
            item.descriptionText ??
            item.descriptionHtml ??
            item.description ??
            item.jobDescription ??
            item.jobDescriptionText ??
            item.fullDescription ??
            item.text ??
            item.content ??
            ''
          ) as string;
          const s = typeof raw === 'string' ? raw.trim() : '';
          return s || null;
        };
        for (const item of results as Record<string, unknown>[]) {
          const companyName = normalizeCompanyName((item.companyName ?? item.company ?? item.companyNameFromProfile ?? '') as string);
          const companyUrl = normalizeLinkedInUrl((item.companyUrl ?? item.companyLink ?? item.companyLinkedInUrl ?? '') as string);
          const key = `${companyName}|${companyUrl ?? ''}`.toLowerCase();
          const companyId = companyIdsByKey.get(key) ?? null;
          await supabase.from('linkedin_job_offers').insert({
            search_id: linkedinSearchId,
            company_id: companyId,
            company_name: companyName || 'Inconnu',
            company_linkedin_url: companyUrl,
            job_title: (item.title ?? item.jobTitle ?? item.position ?? '') as string,
            job_url: (item.url ?? item.jobUrl ?? item.link ?? '') as string || null,
            job_location: (item.location ?? item.jobLocation ?? '') as string || null,
            job_description: getJobDescription(item),
            raw: item,
          });
        }
        await supabase
          .from('linkedin_job_searches')
          .update({
            status: 'completed',
            offers_count: results.length,
            completed_at: new Date().toISOString(),
          })
          .eq('id', linkedinSearchId);
      }
    }

    // Handle different response structures:
    // - Hashtag scraper: returns array of posts directly
    // - Profile scraper: returns array with profile object containing latestPosts
    // - Post scraper (instagram-post-scraper): returns array of posts directly
    let posts: Record<string, unknown>[] = [];
    let profileData: Record<string, unknown> | null = null;
    
    if (results.length > 0 && results[0].latestPosts) {
      // Profile scraper format: extract posts from latestPosts
      profileData = results[0];
      posts = results[0].latestPosts || [];
      console.log(`Profile scraper detected: ${posts.length} posts from @${results[0].username}`);
    } else if (results.length > 0 && (results[0].ownerUsername || results[0].ownerId || results[0].shortCode || results[0].inputUrl)) {
      // Post scraper format: results are posts directly with ownerId/ownerUsername/shortCode
      posts = results;
      // Extract profile info from first post if available
      const firstPost = results[0];
      // Extract username from inputUrl if not directly available
      let username = firstPost.ownerUsername;
      if (!username && firstPost.inputUrl) {
        // inputUrl format: https://www.instagram.com/username
        const match = firstPost.inputUrl.match(/instagram\.com\/([^\/\?]+)/);
        username = match ? match[1] : null;
      }
      if (username || firstPost.ownerId) {
        profileData = {
          username: username || `user_${firstPost.ownerId}`,
          fullName: firstPost.ownerFullName || username || `User ${firstPost.ownerId}`,
        };
      }
      console.log(`Post scraper detected: ${posts.length} posts from @${username || firstPost.ownerId}`);
    } else {
      // Hashtag scraper format or unknown: results are posts directly
      posts = results;
      console.log(`Hashtag/generic scraper detected: ${posts.length} posts`);
    }
    
    const postsCount = posts.length;
    const imagesCount = posts.reduce((acc: number, item: Record<string, unknown>) => {
      const images = item.images || item.displayUrl || item.thumbnailUrl;
      return acc + (Array.isArray(images) ? images.length : images ? 1 : 0);
    }, 0);

    console.log(`Fetched ${postsCount} posts with ${imagesCount} images`);

    // Update job with results - store more posts for better AI analysis
    // Store up to 50 posts for semantic analysis (balance between depth and storage)
    const sampleSize = Math.min(posts.length, 50);
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed',
        result_summary: {
          total_items: postsCount,
          sample: posts.slice(0, sampleSize), // Store up to 50 posts for analysis
          profile: profileData ? {
            username: profileData.username,
            fullName: profileData.fullName,
            biography: profileData.biography,
            followersCount: profileData.followersCount,
            postsCount: profileData.postsCount,
          } : null,
        },
        posts_count: postsCount,
        images_count: imagesCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    return new Response(
      JSON.stringify({
        success: true,
        status: 'completed',
        posts_count: postsCount,
        images_count: imagesCount,
        results: results.slice(0, 100), // Return first 100 for preview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in apify-results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
