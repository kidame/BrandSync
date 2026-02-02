import { supabase } from '@/integrations/supabase/client';

export interface Territory {
  id: string;
  name: string;
  region: string;
  country: string;
  description: string | null;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface BrandDNAReport {
  id: string;
  territory_id: string;
  analysis_period_start: string;
  analysis_period_end: string;
  total_posts: number;
  total_images: number;
  sentiment_score: number | null;
  engagement_rate: number | null;
  summary: Record<string, unknown>;
  visual_identity: Record<string, unknown>;
  semantic_profile: Record<string, unknown>;
  audience_matrix: Record<string, unknown>;
  recommendations: unknown[];
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export const territoriesApi = {
  /**
   * Get all territories
   */
  async getAll(): Promise<{ success: boolean; data?: Territory[]; error?: string }> {
    const { data, error } = await supabase
      .from('territories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Territory[] };
  },

  /**
   * Get a single territory by ID
   */
  async getById(id: string): Promise<{ success: boolean; data?: Territory; error?: string }> {
    const { data, error } = await supabase
      .from('territories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Territory not found' };
    }

    return { success: true, data: data as Territory };
  },

  /**
   * Create a new territory
   */
  async create(territory: Omit<Territory, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Territory; error?: string }> {
    const { data, error } = await supabase
      .from('territories')
      .insert(territory)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Territory };
  },

  /**
   * Update a territory
   */
  async update(id: string, updates: Partial<Territory>): Promise<{ success: boolean; data?: Territory; error?: string }> {
    const { data, error } = await supabase
      .from('territories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Territory };
  },

  /**
   * Delete a territory
   */
  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('territories')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Get Brand DNA reports for a territory
   */
  async getReports(territoryId: string): Promise<{ success: boolean; data?: BrandDNAReport[]; error?: string }> {
    const { data, error } = await supabase
      .from('brand_dna_reports')
      .select('*')
      .eq('territory_id', territoryId)
      .order('generated_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as BrandDNAReport[] };
  },

  /**
   * Get the latest Brand DNA report for a territory
   */
  async getLatestReport(territoryId: string): Promise<{ success: boolean; data?: BrandDNAReport; error?: string }> {
    const { data, error } = await supabase
      .from('brand_dna_reports')
      .select('*')
      .eq('territory_id', territoryId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as BrandDNAReport | undefined };
  },
};
