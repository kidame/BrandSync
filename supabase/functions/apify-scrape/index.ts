import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApifyRunInput {
  territory_id: string;
  actor_id: string;
  input: Record<string, unknown>;
  source: string;
  linkedin_search_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('APIFY_API_KEY');
    if (!apiKey) {
      console.error('APIFY_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Clé Apify manquante. Ajoutez APIFY_API_KEY dans Supabase : Dashboard → Project Settings → Edge Functions → Secrets.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { territory_id, actor_id, input, source, linkedin_search_id }: ApifyRunInput = await req.json();

    if (!territory_id || !actor_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'territory_id et actor_id sont requis.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting Apify actor ${actor_id} for territory ${territory_id}`);

    // Create scraping job record (store linkedin_search_id in config for apify-results)
    const jobConfig: Record<string, unknown> = { actor_id, input };
    if (linkedin_search_id) jobConfig.linkedin_search_id = linkedin_search_id;

    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        territory_id,
        source: source || actor_id,
        status: 'running',
        config: jobConfig,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create job record:', jobError);
      return new Response(
        JSON.stringify({ success: false, error: `Échec création job en base : ${jobError.message}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Link LinkedIn job search if provided
    if (linkedin_search_id) {
      await supabase
        .from('linkedin_job_searches')
        .update({
          scraping_job_id: job.id,
          status: 'running',
        })
        .eq('id', linkedin_search_id);
    }

    // Start Apify actor run
    // Apify uses ~ instead of / for actor IDs (e.g., apify~instagram-hashtag-scraper)
    const formattedActorId = actor_id.replace('/', '~');
    
    // Prepare input based on source type
    let actorInput = input;
    if (source === 'instagram_posts' && input.usernames) {
      // For post scraper (instagram-post-scraper): uses "username" (singular) not "usernames"
      const limit = input.resultsLimit ? Number(input.resultsLimit) : 200;
      const usernames = input.usernames as string[];
      console.log(`Post scraping with limit: ${limit} for username: ${usernames[0]}`);
      actorInput = {
        username: usernames, // instagram-post-scraper expects "username" field with array
        resultsLimit: limit,
      };
    } else if (source === 'instagram_profile' && input.usernames) {
      // For profile scraper (only gets recent posts + profile info)
      const limit = input.resultsLimit ? Number(input.resultsLimit) : 200;
      console.log(`Profile scraping with limit: ${limit}`);
      actorInput = {
        usernames: input.usernames,
        resultsLimit: limit,
      };
    }
    
    console.log(`Calling Apify API: https://api.apify.com/v2/acts/${formattedActorId}/runs`);
    console.log(`Input:`, JSON.stringify(actorInput));
    
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${formattedActorId}/runs?token=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actorInput),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify API error:', runResponse.status, errorText);

      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          error_message: `Apify error: ${runResponse.status}`,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      let detail = errorText;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error?.message) detail = parsed.error.message;
        else if (parsed.message) detail = parsed.message;
      } catch {
        if (detail.length > 200) detail = detail.slice(0, 200) + '…';
      }
      const errMsg = `Apify API ${runResponse.status} : ${detail}`;
      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const runData = await runResponse.json();
    console.log('Apify run started:', runData.data?.id);

    // Update job with run ID
    await supabase
      .from('scraping_jobs')
      .update({
        config: { ...job.config, apify_run_id: runData.data?.id },
      })
      .eq('id', job.id);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        apify_run_id: runData.data?.id,
        status: 'running',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in apify-scrape:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ success: false, error: `apify-scrape : ${errorMessage}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
