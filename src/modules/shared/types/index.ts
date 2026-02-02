// Shared types for BrandSync Intelligence Platform

// Core territory types
export interface Territory {
  id: string;
  name: string;
  slug: string;
  description: string;
  region: string;
  country: string;
  status: 'active' | 'analyzing' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

// Brand DNA types
export interface BrandDNAReport {
  id: string;
  territoryId: string;
  generatedAt: Date;
  summary: BrandSummary;
  visualIdentity: VisualIdentity;
  semanticProfile: SemanticProfile;
  audienceMatrix: AudienceMatrix;
  recommendations: Recommendation[];
}

export interface BrandSummary {
  headline: string;
  description: string;
  keyInsights: string[];
  sentimentScore: number;
  engagementRate: number;
  totalPosts: number;
  totalImages: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Visual Identity (from CLIP analysis)
export interface VisualIdentity {
  dominantColors: ColorPalette;
  sceneCategories: SceneCategory[];
  visualThemes: VisualTheme[];
  moodBoard: MoodBoardItem[];
}

export interface ColorPalette {
  primary: HSLColor[];
  secondary: HSLColor[];
  accent: HSLColor[];
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
  hex: string;
  frequency: number;
}

export interface SceneCategory {
  name: string;
  confidence: number;
  count: number;
  examples: string[];
}

export interface VisualTheme {
  name: string;
  description: string;
  weight: number;
  keywords: string[];
}

export interface MoodBoardItem {
  imageUrl: string;
  caption: string;
  category: string;
  score: number;
}

// Semantic Profile (from NLP analysis)
export interface SemanticProfile {
  topics: Topic[];
  sentimentDistribution: SentimentDistribution;
  emotionalTones: EmotionalTone[];
  keyPhrases: KeyPhrase[];
  narrativeThemes: NarrativeTheme[];
}

export interface Topic {
  name: string;
  weight: number;
  relatedTerms: string[];
  sentiment: number;
}

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface EmotionalTone {
  emotion: string;
  intensity: number;
  examples: string[];
}

export interface KeyPhrase {
  phrase: string;
  frequency: number;
  context: string;
}

export interface NarrativeTheme {
  theme: string;
  description: string;
  prevalence: number;
}

// Audience Matrix (Tribes)
export interface AudienceMatrix {
  tribes: Tribe[];
  overlapMatrix: number[][];
  totalReach: number;
}

export interface Tribe {
  id: string;
  name: string;
  description: string;
  size: number;
  percentage: number;
  characteristics: string[];
  preferredContent: string[];
  engagementPattern: EngagementPattern;
  color: string;
}

export interface EngagementPattern {
  peakHours: number[];
  preferredFormats: string[];
  interactionTypes: {
    type: string;
    percentage: number;
  }[];
}

// Recommendations
export interface Recommendation {
  id: string;
  category: 'content' | 'visual' | 'engagement' | 'timing' | 'audience';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
}

// Graph module types (for future)
export interface SemanticCluster {
  id: string;
  name: string;
  centroid: number[];
  nodes: ClusterNode[];
  connections: ClusterConnection[];
}

export interface ClusterNode {
  id: string;
  label: string;
  type: 'topic' | 'entity' | 'concept';
  weight: number;
  position: { x: number; y: number };
}

export interface ClusterConnection {
  source: string;
  target: string;
  strength: number;
}

// Factory module types (for future)
export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video' | 'text' | 'palette';
  content: string;
  metadata: Record<string, unknown>;
  generatedAt: Date;
}

// Engine module types (for future)
export interface Pipeline {
  id: string;
  name: string;
  steps: PipelineStep[];
  status: 'idle' | 'running' | 'completed' | 'error';
}

export interface PipelineStep {
  id: string;
  name: string;
  type: 'scrape' | 'analyze' | 'generate' | 'export';
  config: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'error';
}
