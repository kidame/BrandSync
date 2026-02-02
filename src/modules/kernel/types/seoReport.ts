// Types for professional SEO Report

export interface SEOReportMetadata {
  url: string;
  analyzedAt: string;
  overallScore: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'critical';
}

export interface SEOReportScores {
  seo: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
}

export interface SEODetailItem {
  present: boolean;
  content?: string;
  length?: number;
  score?: number;
}

export interface SEOReportSEODetails {
  metaDescription: SEODetailItem;
  titleTag: SEODetailItem;
  viewport: boolean;
  isCrawlable: boolean;
  robotsTxt: SEODetailItem;
  canonical: SEODetailItem;
  hreflang: SEODetailItem;
  structuredData: SEODetailItem;
}

export interface PerformanceMetric {
  value: number;
  displayValue: string;
  score: number;
  status: 'good' | 'needs-improvement' | 'poor';
}

export interface SEOReportPerformanceMetrics {
  fcp: PerformanceMetric;
  lcp: PerformanceMetric;
  tbt: PerformanceMetric;
  cls: PerformanceMetric;
  speedIndex: PerformanceMetric;
  tti: PerformanceMetric;
}

export interface AccessibilityItem {
  title: string;
  passed: boolean;
  description?: string;
  failingElements?: number;
}

export interface SEOReportAccessibility {
  colorContrast: AccessibilityItem;
  formLabels: AccessibilityItem;
  imageAlt: AccessibilityItem;
  buttonName: AccessibilityItem;
  linkName: AccessibilityItem;
  ariaAttributes: AccessibilityItem;
}

export interface BestPracticeItem {
  title: string;
  passed: boolean;
  description?: string;
}

export interface SEOReportBestPractices {
  https: BestPracticeItem;
  consoleErrors: BestPracticeItem;
  deprecatedApis: BestPracticeItem;
  imageAspectRatio: BestPracticeItem;
}

export interface SEOOpportunity {
  id: string;
  category: 'seo' | 'performance' | 'accessibility' | 'best-practices';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  score: number;
  savings?: string;
}

export interface SEORecommendation {
  problem: string;
  category: 'seo' | 'performance' | 'accessibility' | 'best-practices';
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: number;
}

// Données étendues extraites du rapport Lighthouse
export interface ImageWithoutAlt {
  src: string;
  snippet?: string;
  selector?: string;
}

export interface LinkWithoutText {
  href?: string;
  snippet?: string;
  selector?: string;
}

export interface RenderBlockingResource {
  url: string;
  totalBytes?: number;
  wastedMs?: number;
}

export interface UnusedResource {
  url: string;
  totalBytes?: number;
  wastedBytes?: number;
  wastedPercent?: number;
}

export interface PageMetrics {
  totalSizeBytes: number;
  totalRequests: number;
  jsSize?: number;
  cssSize?: number;
  imageSize?: number;
  fontSize?: number;
}

export interface StructuredDataInfo {
  hasStructuredData: boolean;
  types: string[];
  raw?: unknown;
}

export interface MetaTagsInfo {
  hasOpenGraph: boolean;
  hasTwitterCards: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface HeadingStructure {
  h1: string[];
  h2: string[];
  h3: string[];
  hasMultipleH1: boolean;
}

export interface ColorContrastIssue {
  element?: string;
  snippet?: string;
  contrastRatio?: number;
  expectedRatio?: number;
}

export interface SEOReportExtendedData {
  imagesWithoutAlt: ImageWithoutAlt[];
  linksWithoutText: LinkWithoutText[];
  renderBlockingResources: RenderBlockingResource[];
  unusedJavascript: UnusedResource[];
  unusedCss: UnusedResource[];
  pageMetrics: PageMetrics;
  structuredData: StructuredDataInfo;
  metaTags: MetaTagsInfo;
  headingStructure: HeadingStructure;
  colorContrastIssues: ColorContrastIssue[];
}

export interface SEOReport {
  metadata: SEOReportMetadata;
  scores: SEOReportScores;
  /** Scores desktop (si analyse mobile + desktop) */
  desktopScores?: SEOReportScores | null;
  seoDetails: SEOReportSEODetails;
  performanceMetrics: SEOReportPerformanceMetrics;
  accessibility: SEOReportAccessibility;
  bestPractices: SEOReportBestPractices;
  opportunities: SEOOpportunity[];
  recommendations: SEORecommendation[];
  strengths: string[];
  criticalIssues: string[];
  /** Données étendues (images sans alt, liens, ressources, etc.) */
  extendedData?: SEOReportExtendedData | null;
}

// Helper function to get status from score
export function getScoreStatus(score: number): 'excellent' | 'good' | 'needs-improvement' | 'critical' {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'critical';
}

export function getMetricStatus(score: number): 'good' | 'needs-improvement' | 'poor' {
  if (score >= 0.9) return 'good';
  if (score >= 0.5) return 'needs-improvement';
  return 'poor';
}

/** Métriques Core Web Vitals brutes (pour comparatif Mobile vs Desktop) */
export interface CoreWebVitalsMetrics {
  fcp: number;  // First Contentful Paint (ms)
  lcp: number;  // Largest Contentful Paint (ms)
  tbt: number;  // Total Blocking Time (ms)
  cls: number;  // Cumulative Layout Shift
  si: number;   // Speed Index (ms)
  tti: number;  // Time to Interactive (ms)
}

/** Payload pour l'analyse IA du comparatif */
export interface AnalyzeSEOComparisonPayload {
  website_url: string;
  mobile_scores: SEOReportScores;
  desktop_scores: SEOReportScores;
  mobile_metrics?: CoreWebVitalsMetrics;
  desktop_metrics?: CoreWebVitalsMetrics;
  images_without_alt_count?: number;
  render_blocking_count?: number;
  unused_js_bytes?: number;
}

/** Réponse de l'Edge Function analyze-seo-comparison */
export interface AnalyzeSEOComparisonResponse {
  success: boolean;
  analysis?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  key_issues?: string[];
  error?: string;
}
