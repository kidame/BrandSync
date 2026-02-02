export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brand_dna_reports: {
        Row: {
          analysis_period_end: string
          analysis_period_start: string
          audience_matrix: Json
          created_at: string
          engagement_rate: number | null
          generated_at: string
          id: string
          recommendations: Json
          semantic_profile: Json
          sentiment_score: number | null
          summary: Json
          territory_id: string
          total_images: number
          total_posts: number
          updated_at: string
          visual_identity: Json
        }
        Insert: {
          analysis_period_end: string
          analysis_period_start: string
          audience_matrix?: Json
          created_at?: string
          engagement_rate?: number | null
          generated_at?: string
          id?: string
          recommendations?: Json
          semantic_profile?: Json
          sentiment_score?: number | null
          summary?: Json
          territory_id: string
          total_images?: number
          total_posts?: number
          updated_at?: string
          visual_identity?: Json
        }
        Update: {
          analysis_period_end?: string
          analysis_period_start?: string
          audience_matrix?: Json
          created_at?: string
          engagement_rate?: number | null
          generated_at?: string
          id?: string
          recommendations?: Json
          semantic_profile?: Json
          sentiment_score?: number | null
          summary?: Json
          territory_id?: string
          total_images?: number
          total_posts?: number
          updated_at?: string
          visual_identity?: Json
        }
        Relationships: [
          {
            foreignKeyName: "brand_dna_reports_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      scraping_jobs: {
        Row: {
          completed_at: string | null
          config: Json
          created_at: string
          error_message: string | null
          id: string
          images_count: number | null
          posts_count: number | null
          result_summary: Json | null
          source: string
          started_at: string | null
          status: string
          territory_id: string
        }
        Insert: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          images_count?: number | null
          posts_count?: number | null
          result_summary?: Json | null
          source: string
          started_at?: string | null
          status?: string
          territory_id: string
        }
        Update: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          images_count?: number | null
          posts_count?: number | null
          result_summary?: Json | null
          source?: string
          started_at?: string | null
          status?: string
          territory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraping_jobs_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_analyses: {
        Row: {
          accessibility_score: number | null
          analyzed_at: string
          best_practices_score: number | null
          created_at: string
          full_report: Json | null
          has_meta_description: boolean | null
          has_viewport: boolean | null
          id: string
          is_crawlable: boolean | null
          meta_description: string | null
          performance_score: number | null
          seo_score: number | null
          territory_id: string
          title_tag: string | null
          website_url: string
        }
        Insert: {
          accessibility_score?: number | null
          analyzed_at?: string
          best_practices_score?: number | null
          created_at?: string
          full_report?: Json | null
          has_meta_description?: boolean | null
          has_viewport?: boolean | null
          id?: string
          is_crawlable?: boolean | null
          meta_description?: string | null
          performance_score?: number | null
          seo_score?: number | null
          territory_id: string
          title_tag?: string | null
          website_url: string
        }
        Update: {
          accessibility_score?: number | null
          analyzed_at?: string
          best_practices_score?: number | null
          created_at?: string
          full_report?: Json | null
          has_meta_description?: boolean | null
          has_viewport?: boolean | null
          id?: string
          is_crawlable?: boolean | null
          meta_description?: string | null
          performance_score?: number | null
          seo_score?: number | null
          territory_id?: string
          title_tag?: string | null
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_analyses_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          country: string
          created_at: string
          description: string | null
          id: string
          name: string
          region: string
          status: string
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          region: string
          status?: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          region?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
