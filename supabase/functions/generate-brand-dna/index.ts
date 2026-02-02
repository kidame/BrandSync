import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GenerateDNAInput {
  territory_id: string;
  job_id: string;
}

interface InstagramComment {
  text?: string;
  ownerUsername?: string;
  likesCount?: number;
}

interface InstagramPost {
  id?: string;
  shortCode?: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  displayUrl?: string;
  thumbnailUrl?: string;
  images?: string[];
  timestamp?: string;
  hashtags?: string[];
  ownerUsername?: string;
  latestComments?: InstagramComment[];
  firstComment?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { territory_id, job_id }: GenerateDNAInput = await req.json();

    if (!territory_id || !job_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'territory_id and job_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating Brand DNA for territory ${territory_id} from job ${job_id}`);

    // Fetch territory info
    const { data: territory, error: territoryError } = await supabase
      .from('territories')
      .select('*')
      .eq('id', territory_id)
      .single();

    if (territoryError || !territory) {
      console.error('Territory not found:', territoryError);
      return new Response(
        JSON.stringify({ success: false, error: 'Territory not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch scraping job with results
    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      console.error('Scraping job not found:', jobError);
      return new Response(
        JSON.stringify({ success: false, error: 'Scraping job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (job.status !== 'completed') {
      return new Response(
        JSON.stringify({ success: false, error: 'Scraping job not completed yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get posts from result_summary
    const resultSummary = job.result_summary as { total_items?: number; sample?: InstagramPost[] } | null;
    const posts: InstagramPost[] = resultSummary?.sample || [];
    const totalPosts = job.posts_count || posts.length;
    const totalImages = job.images_count || 0;

    if (posts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No posts found in scraping results' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${posts.length} sample posts (${totalPosts} total)`);

    // Prepare posts data for AI analysis - use all available samples (up to 50)
    // Select a diverse sample: mix of high engagement and varied timestamps
    const sortedByEngagement = [...posts].sort((a, b) => 
      ((b.likesCount || 0) + (b.commentsCount || 0)) - ((a.likesCount || 0) + (a.commentsCount || 0))
    );
    
    // Take top 20 by engagement + 30 random others for diversity
    const topEngaged = sortedByEngagement.slice(0, 20);
    const others = sortedByEngagement.slice(20);
    const randomOthers = others.sort(() => Math.random() - 0.5).slice(0, 30);
    const selectedPosts = [...topEngaged, ...randomOthers];
    
    const postsForAnalysis = selectedPosts.map((post: InstagramPost) => {
      // Extract comment texts for sentiment analysis
      const comments: string[] = [];
      if (post.latestComments && Array.isArray(post.latestComments)) {
        post.latestComments.forEach((c: InstagramComment) => {
          if (c.text && c.text.trim()) {
            comments.push(c.text.trim());
          }
        });
      }
      if (post.firstComment && post.firstComment.trim()) {
        comments.push(post.firstComment.trim());
      }
      
      return {
        caption: post.caption || '',
        likes: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        comments: comments.slice(0, 10), // Include up to 10 comments per post
        hashtags: post.hashtags || [],
        timestamp: post.timestamp
      };
    });

    // Count total comments for logging
    const totalComments = postsForAnalysis.reduce((sum, p) => sum + p.comments.length, 0);
    console.log(`Analysis includes ${totalComments} comments from ${postsForAnalysis.length} posts`);

    // Call Lovable AI for analysis
    const analysisPrompt = `Tu es un expert en analyse de marque territoriale et en stratégie de communication digitale.

Analyse ces ${totalPosts} posts Instagram collectés pour le territoire "${territory.name}" (${territory.region}, ${territory.country}).

Voici ${postsForAnalysis.length} posts représentatifs (sélectionnés pour leur engagement et leur diversité temporelle), INCLUANT les commentaires du public:
${JSON.stringify(postsForAnalysis, null, 2)}

IMPORTANT: Utilise les commentaires pour enrichir ton analyse du sentiment et de l'audience. Les commentaires reflètent les vraies réactions du public.

Génère un rapport Brand DNA complet avec la structure suivante. Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans commentaires.
Base ton analyse sémantique sur les captions, hashtags, commentaires et patterns d'engagement observés dans ces ${postsForAnalysis.length} posts.`;

    console.log('Calling OpenAI for Brand DNA analysis...');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en analyse de marque territoriale. Tu génères des rapports Brand DNA structurés en JSON.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_brand_dna_report',
              description: 'Génère un rapport Brand DNA complet basé sur l\'analyse des posts',
              parameters: {
                type: 'object',
                properties: {
                  summary: {
                    type: 'object',
                    properties: {
                      headline: { type: 'string', description: 'Titre accrocheur résumant l\'identité' },
                      description: { type: 'string', description: 'Description détaillée de l\'identité' },
                      keyInsights: { type: 'array', items: { type: 'string' }, description: '5 insights clés' },
                      sentimentScore: { type: 'number', description: 'Score de sentiment entre 0 et 1' },
                      engagementRate: { type: 'number', description: 'Taux d\'engagement moyen en %' }
                    },
                    required: ['headline', 'description', 'keyInsights', 'sentimentScore', 'engagementRate']
                  },
                  visualIdentity: {
                    type: 'object',
                    properties: {
                      dominantColors: {
                        type: 'object',
                        properties: {
                          primary: { type: 'array', items: { type: 'object', properties: { h: { type: 'number' }, s: { type: 'number' }, l: { type: 'number' }, hex: { type: 'string' }, frequency: { type: 'number' } } } },
                          secondary: { type: 'array', items: { type: 'object', properties: { h: { type: 'number' }, s: { type: 'number' }, l: { type: 'number' }, hex: { type: 'string' }, frequency: { type: 'number' } } } },
                          accent: { type: 'array', items: { type: 'object', properties: { h: { type: 'number' }, s: { type: 'number' }, l: { type: 'number' }, hex: { type: 'string' }, frequency: { type: 'number' } } } }
                        }
                      },
                      sceneCategories: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, confidence: { type: 'number' }, count: { type: 'number' }, examples: { type: 'array', items: { type: 'string' } } } } },
                      visualThemes: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, weight: { type: 'number' }, keywords: { type: 'array', items: { type: 'string' } } } } },
                      moodBoard: { type: 'array', items: { type: 'object', properties: { imageUrl: { type: 'string' }, caption: { type: 'string' }, category: { type: 'string' }, score: { type: 'number' } } } }
                    }
                  },
                  semanticProfile: {
                    type: 'object',
                    properties: {
                      topics: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, weight: { type: 'number' }, relatedTerms: { type: 'array', items: { type: 'string' } }, sentiment: { type: 'number' } } } },
                      sentimentDistribution: { type: 'object', properties: { positive: { type: 'number' }, neutral: { type: 'number' }, negative: { type: 'number' } } },
                      emotionalTones: { type: 'array', items: { type: 'object', properties: { emotion: { type: 'string' }, intensity: { type: 'number' }, examples: { type: 'array', items: { type: 'string' } } } } },
                      keyPhrases: { type: 'array', items: { type: 'object', properties: { phrase: { type: 'string' }, frequency: { type: 'number' }, context: { type: 'string' } } } },
                      narrativeThemes: { type: 'array', items: { type: 'object', properties: { theme: { type: 'string' }, description: { type: 'string' }, prevalence: { type: 'number' } } } }
                    }
                  },
                  audienceMatrix: {
                    type: 'object',
                    properties: {
                      tribes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, size: { type: 'number' }, percentage: { type: 'number' }, characteristics: { type: 'array', items: { type: 'string' } }, preferredContent: { type: 'array', items: { type: 'string' } }, color: { type: 'string' }, engagementPattern: { type: 'object', properties: { peakHours: { type: 'array', items: { type: 'number' } }, preferredFormats: { type: 'array', items: { type: 'string' } }, interactionTypes: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, percentage: { type: 'number' } } } } } } } } },
                      overlapMatrix: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
                      totalReach: { type: 'number' }
                    }
                  },
                  recommendations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        category: { type: 'string', enum: ['content', 'visual', 'engagement', 'timing', 'audience'] },
                        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        actionItems: { type: 'array', items: { type: 'string' } },
                        expectedImpact: { type: 'string' }
                      },
                      required: ['id', 'category', 'priority', 'title', 'description', 'actionItems', 'expectedImpact']
                    }
                  }
                },
                required: ['summary', 'visualIdentity', 'semanticProfile', 'audienceMatrix', 'recommendations']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_brand_dna_report' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted, please add funds' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_brand_dna_report') {
      console.error('No valid tool call in AI response');
      return new Response(
        JSON.stringify({ success: false, error: 'AI did not return valid analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let brandDNA;
    try {
      brandDNA = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse AI analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Brand DNA generated successfully');

    // Calculate date range from posts
    const timestamps = posts
      .map((p: InstagramPost) => p.timestamp)
      .filter((t): t is string => !!t)
      .map(t => new Date(t));
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const startDate = timestamps.length > 0 
      ? new Date(Math.min(...timestamps.map(d => d.getTime())))
      : thirtyDaysAgo;
    const endDate = timestamps.length > 0 
      ? new Date(Math.max(...timestamps.map(d => d.getTime())))
      : now;

    // Enrich summary with actual stats
    const enrichedSummary = {
      ...brandDNA.summary,
      totalPosts,
      totalImages,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

    // Save to brand_dna_reports table
    const { data: report, error: insertError } = await supabase
      .from('brand_dna_reports')
      .insert({
        territory_id,
        analysis_period_start: startDate.toISOString().split('T')[0],
        analysis_period_end: endDate.toISOString().split('T')[0],
        total_posts: totalPosts,
        total_images: totalImages,
        sentiment_score: brandDNA.summary.sentimentScore,
        engagement_rate: brandDNA.summary.engagementRate,
        summary: enrichedSummary,
        visual_identity: brandDNA.visualIdentity,
        semantic_profile: brandDNA.semanticProfile,
        audience_matrix: brandDNA.audienceMatrix,
        recommendations: brandDNA.recommendations,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save Brand DNA report:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Brand DNA report saved with ID:', report.id);

    return new Response(
      JSON.stringify({
        success: true,
        report_id: report.id,
        summary: {
          headline: brandDNA.summary.headline,
          totalPosts,
          totalImages,
          sentimentScore: brandDNA.summary.sentimentScore,
          engagementRate: brandDNA.summary.engagementRate
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-brand-dna:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
