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

export interface SEOReport {
  metadata: SEOReportMetadata;
  scores: SEOReportScores;
  seoDetails: SEOReportSEODetails;
  performanceMetrics: SEOReportPerformanceMetrics;
  accessibility: SEOReportAccessibility;
  bestPractices: SEOReportBestPractices;
  opportunities: SEOOpportunity[];
  recommendations: SEORecommendation[];
  strengths: string[];
  criticalIssues: string[];
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
