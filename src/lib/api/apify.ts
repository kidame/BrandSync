import { supabase } from '@/integrations/supabase/client';

type ApifyResponse<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

type ScrapingJobResponse = {
  job_id: string;
  apify_run_id: string;
  status: string;
};

type ScrapingResultsResponse = {
  status: string;
  posts_count?: number;
  images_count?: number;
  results?: unknown[];
  message?: string;
};

// Common Apify actors for social media scraping
export const APIFY_ACTORS = {
  INSTAGRAM_HASHTAG: 'apify/instagram-hashtag-scraper',
  INSTAGRAM_PROFILE: 'apify/instagram-profile-scraper',
  INSTAGRAM_POST: 'apify/instagram-post-scraper',
  TIKTOK_HASHTAG: 'clockworks/tiktok-scraper',
  TWITTER_SEARCH: 'quacker/twitter-scraper',
  GOOGLE_MAPS: 'compass/google-maps-scraper',
  LINKEDIN_JOBS: 'curious_coder/linkedin-jobs-scraper',
} as const;

export const apifyApi = {
  /**
   * Start a scraping job with an Apify actor
   */
  async startScraping(
    territoryId: string,
    actorId: string,
    input: Record<string, unknown>,
    source?: string
  ): Promise<ApifyResponse<ScrapingJobResponse>> {
    const { data, error } = await supabase.functions.invoke('apify-scrape', {
      body: {
        territory_id: territoryId,
        actor_id: actorId,
        input,
        source: source || actorId,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: data.success, data, error: data.error };
  },

  /**
   * Get results from a completed scraping job
   */
  async getResults(
    jobId: string,
    apifyRunId: string
  ): Promise<ApifyResponse<ScrapingResultsResponse>> {
    const { data, error } = await supabase.functions.invoke('apify-results', {
      body: {
        job_id: jobId,
        apify_run_id: apifyRunId,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: data.success, data, error: data.error };
  },

  /**
   * Scrape Instagram hashtags for a territory
   */
  async scrapeInstagramHashtags(
    territoryId: string,
    hashtags: string[],
    options?: {
      resultsLimit?: number;
      searchType?: 'hashtag' | 'user' | 'place';
    }
  ): Promise<ApifyResponse<ScrapingJobResponse>> {
    return this.startScraping(
      territoryId,
      APIFY_ACTORS.INSTAGRAM_HASHTAG,
      {
        hashtags,
        resultsLimit: options?.resultsLimit || 100,
        searchType: options?.searchType || 'hashtag',
      },
      'instagram'
    );
  },

  /**
   * Scrape Instagram posts from profiles for a territory
   * Uses instagram-post-scraper which can get ALL posts, not just recent ones
   */
  async scrapeInstagramProfiles(
    territoryId: string,
    usernames: string[],
    options?: {
      resultsLimit?: number;
    }
  ): Promise<ApifyResponse<ScrapingJobResponse>> {
    return this.startScraping(
      territoryId,
      APIFY_ACTORS.INSTAGRAM_POST, // Use post scraper to get ALL posts
      {
        usernames,
        resultsLimit: options?.resultsLimit || 200,
      },
      'instagram_posts'
    );
  },

  /**
   * Scrape TikTok hashtags for a territory
   */
  async scrapeTikTokHashtags(
    territoryId: string,
    hashtags: string[],
    options?: {
      resultsPerPage?: number;
      shouldDownloadVideos?: boolean;
    }
  ): Promise<ApifyResponse<ScrapingJobResponse>> {
    return this.startScraping(
      territoryId,
      APIFY_ACTORS.TIKTOK_HASHTAG,
      {
        hashtags,
        resultsPerPage: options?.resultsPerPage || 100,
        shouldDownloadVideos: options?.shouldDownloadVideos || false,
      },
      'tiktok'
    );
  },

  /**
   * Get all scraping jobs for a territory
   */
  async getScrapingJobs(territoryId: string) {
    const { data, error } = await supabase
      .from('scraping_jobs')
      .select('*')
      .eq('territory_id', territoryId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  },

  /**
   * Scraper les offres LinkedIn par domaine (marketing, tourisme, etc.)
   * searchUrl: URL de recherche LinkedIn (ex: https://www.linkedin.com/jobs/search/?keywords=marketing&location=Suisse)
   * linkedinSearchId: ID de la recherche (table linkedin_job_searches) pour lier le job
   */
  async scrapeLinkedInJobs(
    territoryId: string,
    searchUrl: string,
    options?: {
      linkedinSearchId?: string;
      count?: number;
    }
  ): Promise<ApifyResponse<ScrapingJobResponse>> {
    const urls = [searchUrl];
    const input: Record<string, unknown> = {
      urls,
      scrapeCompany: true,
      count: options?.count ?? 100,
    };
    const { data, error } = await supabase.functions.invoke('apify-scrape', {
      body: {
        territory_id: territoryId,
        actor_id: APIFY_ACTORS.LINKEDIN_JOBS,
        input,
        source: 'linkedin_jobs',
        linkedin_search_id: options?.linkedinSearchId,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: data.success, data, error: data.error };
  },
};
