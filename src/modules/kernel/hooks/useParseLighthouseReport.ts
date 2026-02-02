import type { SEOAnalysis } from "../components/SEOAnalysis/SEOAnalysisResults";
import type {
  SEOReport,
  SEOOpportunity,
  SEORecommendation,
  PerformanceMetric,
  SEOReportExtendedData,
  SEOReportScores,
} from "../types/seoReport";
import { getScoreStatus, getMetricStatus } from "../types/seoReport";
import { extractLighthouseExtended } from "./extractLighthouseExtended";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LighthouseAudit = Record<string, any>;

function getAudit(audits: LighthouseAudit, key: string) {
  return audits?.[key] || {};
}

function parsePerformanceMetric(audit: LighthouseAudit): PerformanceMetric {
  const score = audit?.score ?? 0;
  return {
    value: audit?.numericValue ?? 0,
    displayValue: audit?.displayValue || "N/A",
    score: score,
    status: getMetricStatus(score),
  };
}

export function useParseLighthouseReport() {
  const parseReport = (analysis: SEOAnalysis): SEOReport => {
    const fullReport = analysis.full_report as LighthouseAudit;
    const audits = fullReport?.audits || {};
    const categories = fullReport?.categories || {};

    // Scores (mobile)
    const scores: SEOReportScores = {
      seo: analysis.seo_score ?? 0,
      performance: analysis.performance_score ?? 0,
      accessibility: analysis.accessibility_score ?? 0,
      bestPractices: analysis.best_practices_score ?? 0,
    };

    // Scores desktop (si analyse dual)
    const desktopScores: SEOReportScores | null = analysis.desktop_scores
      ? {
          seo: analysis.desktop_scores.seo ?? 0,
          performance: analysis.desktop_scores.performance ?? 0,
          accessibility: analysis.desktop_scores.accessibility ?? 0,
          bestPractices: analysis.desktop_scores.bestPractices ?? 0,
        }
      : null;

    const overallScore = Math.round(
      (scores.seo + scores.performance + scores.accessibility + scores.bestPractices) / 4
    );

    // SEO Details
    const metaDescAudit = getAudit(audits, "meta-description");
    const titleAudit = getAudit(audits, "document-title");
    const robotsAudit = getAudit(audits, "robots-txt");
    const canonicalAudit = getAudit(audits, "canonical");
    const hreflangAudit = getAudit(audits, "hreflang");
    const structuredDataAudit = getAudit(audits, "structured-data");

    const seoDetails = {
      metaDescription: {
        present: analysis.has_meta_description,
        content: metaDescAudit?.details?.items?.[0]?.description || analysis.meta_description || undefined,
        length: analysis.meta_description?.length,
        score: metaDescAudit?.score ?? 0,
      },
      titleTag: {
        present: Boolean(analysis.title_tag),
        content: analysis.title_tag || undefined,
        length: analysis.title_tag?.length,
        score: titleAudit?.score ?? 0,
      },
      viewport: analysis.has_viewport,
      isCrawlable: analysis.is_crawlable,
      robotsTxt: {
        present: (robotsAudit?.score ?? 0) >= 0.5,
        score: robotsAudit?.score ?? 0,
      },
      canonical: {
        present: (canonicalAudit?.score ?? 0) >= 0.5,
        content: canonicalAudit?.details?.items?.[0]?.href,
        score: canonicalAudit?.score ?? 0,
      },
      hreflang: {
        present: (hreflangAudit?.score ?? 0) >= 0.5,
        score: hreflangAudit?.score ?? 0,
      },
      structuredData: {
        present: (structuredDataAudit?.score ?? 0) >= 0.5,
        score: structuredDataAudit?.score ?? 0,
      },
    };

    // Performance Metrics
    const performanceMetrics = {
      fcp: parsePerformanceMetric(getAudit(audits, "first-contentful-paint")),
      lcp: parsePerformanceMetric(getAudit(audits, "largest-contentful-paint")),
      tbt: parsePerformanceMetric(getAudit(audits, "total-blocking-time")),
      cls: parsePerformanceMetric(getAudit(audits, "cumulative-layout-shift")),
      speedIndex: parsePerformanceMetric(getAudit(audits, "speed-index")),
      tti: parsePerformanceMetric(getAudit(audits, "interactive")),
    };

    // Accessibility
    const colorContrastAudit = getAudit(audits, "color-contrast");
    const formLabelsAudit = getAudit(audits, "label");
    const imageAltAudit = getAudit(audits, "image-alt");
    const buttonNameAudit = getAudit(audits, "button-name");
    const linkNameAudit = getAudit(audits, "link-name");
    const ariaAudit = getAudit(audits, "aria-required-attr");

    const accessibility = {
      colorContrast: {
        title: "Contraste des couleurs",
        passed: (colorContrastAudit?.score ?? 0) >= 0.5,
        description: colorContrastAudit?.description,
        failingElements: colorContrastAudit?.details?.items?.length || 0,
      },
      formLabels: {
        title: "Labels des formulaires",
        passed: (formLabelsAudit?.score ?? 0) >= 0.5,
        description: formLabelsAudit?.description,
        failingElements: formLabelsAudit?.details?.items?.length || 0,
      },
      imageAlt: {
        title: "Attributs alt des images",
        passed: (imageAltAudit?.score ?? 0) >= 0.5,
        description: imageAltAudit?.description,
        failingElements: imageAltAudit?.details?.items?.length || 0,
      },
      buttonName: {
        title: "Noms des boutons",
        passed: (buttonNameAudit?.score ?? 0) >= 0.5,
        description: buttonNameAudit?.description,
        failingElements: buttonNameAudit?.details?.items?.length || 0,
      },
      linkName: {
        title: "Noms des liens",
        passed: (linkNameAudit?.score ?? 0) >= 0.5,
        description: linkNameAudit?.description,
        failingElements: linkNameAudit?.details?.items?.length || 0,
      },
      ariaAttributes: {
        title: "Attributs ARIA",
        passed: (ariaAudit?.score ?? 0) >= 0.5,
        description: ariaAudit?.description,
        failingElements: ariaAudit?.details?.items?.length || 0,
      },
    };

    // Best Practices
    const httpsAudit = getAudit(audits, "is-on-https");
    const consoleErrorsAudit = getAudit(audits, "errors-in-console");
    const deprecationsAudit = getAudit(audits, "deprecations");
    const imageAspectAudit = getAudit(audits, "image-aspect-ratio");

    const bestPractices = {
      https: {
        title: "HTTPS",
        passed: (httpsAudit?.score ?? 0) >= 0.5,
        description: httpsAudit?.description,
      },
      consoleErrors: {
        title: "Erreurs console",
        passed: (consoleErrorsAudit?.score ?? 0) >= 0.5,
        description: consoleErrorsAudit?.description,
      },
      deprecatedApis: {
        title: "APIs dépréciées",
        passed: (deprecationsAudit?.score ?? 0) >= 0.5,
        description: deprecationsAudit?.description,
      },
      imageAspectRatio: {
        title: "Ratio d'aspect des images",
        passed: (imageAspectAudit?.score ?? 0) >= 0.5,
        description: imageAspectAudit?.description,
      },
    };

    // Opportunities (failed audits with savings)
    const opportunities: SEOOpportunity[] = [];
    const categoryMap: Record<string, 'seo' | 'performance' | 'accessibility' | 'best-practices'> = {};

    // Map audits to categories
    const seoAuditRefs = categories?.seo?.auditRefs || [];
    const perfAuditRefs = categories?.performance?.auditRefs || [];
    const a11yAuditRefs = categories?.accessibility?.auditRefs || [];
    const bpAuditRefs = categories?.["best-practices"]?.auditRefs || [];

    seoAuditRefs.forEach((ref: { id: string }) => (categoryMap[ref.id] = "seo"));
    perfAuditRefs.forEach((ref: { id: string }) => (categoryMap[ref.id] = "performance"));
    a11yAuditRefs.forEach((ref: { id: string }) => (categoryMap[ref.id] = "accessibility"));
    bpAuditRefs.forEach((ref: { id: string }) => (categoryMap[ref.id] = "best-practices"));

    Object.entries(audits).forEach(([id, audit]) => {
      const auditData = audit as LighthouseAudit;
      const score = auditData?.score;
      
      if (score !== null && score !== undefined && score < 0.9 && auditData?.title) {
        const impact: 'high' | 'medium' | 'low' = score < 0.5 ? 'high' : score < 0.75 ? 'medium' : 'low';
        
        opportunities.push({
          id,
          category: categoryMap[id] || 'performance',
          title: auditData.title,
          description: auditData.description || "",
          impact,
          score: Math.round((score || 0) * 100),
          savings: auditData.details?.overallSavingsMs 
            ? `${Math.round(auditData.details.overallSavingsMs)}ms` 
            : undefined,
        });
      }
    });

    // Sort by impact
    opportunities.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.impact] - order[b.impact];
    });

    // Build recommendations from opportunities
    const recommendations: SEORecommendation[] = opportunities
      .filter(opp => opp.impact !== 'low')
      .slice(0, 10)
      .map(opp => ({
        problem: opp.title,
        category: opp.category,
        priority: opp.impact === 'high' ? 'critical' : opp.impact === 'medium' ? 'high' : 'medium',
        effort: opp.impact === 'high' ? 'medium' : 'low',
        impact: 100 - opp.score,
      }));

    // Strengths (high scoring audits)
    const strengths: string[] = [];
    Object.entries(audits).forEach(([, audit]) => {
      const auditData = audit as LighthouseAudit;
      if (auditData?.score === 1 && auditData?.title) {
        strengths.push(auditData.title);
      }
    });

    // Critical issues
    const criticalIssues = opportunities
      .filter(opp => opp.impact === 'high')
      .slice(0, 5)
      .map(opp => opp.title);

    // Données étendues : depuis la base ou extraction depuis full_report
    let extendedData: SEOReportExtendedData | null = null;
    if (
      analysis.images_without_alt?.length !== undefined ||
      analysis.page_size_bytes !== undefined
    ) {
      extendedData = buildExtendedDataFromAnalysis(analysis);
    } else if (fullReport && typeof fullReport === "object") {
      const extracted = extractLighthouseExtended(fullReport as Record<string, unknown>);
      extendedData = {
        imagesWithoutAlt: extracted.images_without_alt,
        linksWithoutText: extracted.links_without_text,
        renderBlockingResources: extracted.render_blocking_resources,
        unusedJavascript: extracted.unused_javascript,
        unusedCss: extracted.unused_css,
        pageMetrics: {
          totalSizeBytes: extracted.page_size_bytes ?? 0,
          totalRequests: extracted.request_count ?? 0,
        },
        structuredData: {
          hasStructuredData: extracted.has_structured_data ?? false,
          types: extracted.structured_data_types ?? [],
        },
        metaTags: {
          hasOpenGraph: Boolean(extracted.open_graph_tags?.ogTitle ?? extracted.open_graph_tags?.ogDescription ?? extracted.open_graph_tags?.ogImage),
          hasTwitterCards: extracted.open_graph_tags?.hasTwitterCards ?? false,
          ogTitle: extracted.open_graph_tags?.ogTitle,
          ogDescription: extracted.open_graph_tags?.ogDescription,
          ogImage: extracted.open_graph_tags?.ogImage,
        },
        headingStructure: {
          h1: extracted.h1_tags ?? [],
          h2: extracted.h2_tags ?? [],
          h3: extracted.h3_tags ?? [],
          hasMultipleH1: (extracted.h1_tags?.length ?? 0) > 1,
        },
        colorContrastIssues: extracted.color_contrast_issues ?? [],
      };
    }

    return {
      metadata: {
        url: analysis.website_url,
        analyzedAt: analysis.analyzed_at,
        overallScore,
        status: getScoreStatus(overallScore),
      },
      scores,
      desktopScores: desktopScores ?? undefined,
      seoDetails,
      performanceMetrics,
      accessibility,
      bestPractices,
      opportunities: opportunities.slice(0, 20),
      recommendations,
      strengths: strengths.slice(0, 5),
      criticalIssues,
      extendedData: extendedData ?? undefined,
    };
  };

  return { parseReport };
}

function buildExtendedDataFromAnalysis(analysis: SEOAnalysis): SEOReportExtendedData {
  return {
    imagesWithoutAlt: analysis.images_without_alt ?? [],
    linksWithoutText: analysis.links_without_text ?? [],
    renderBlockingResources: analysis.render_blocking_resources ?? [],
    unusedJavascript: analysis.unused_javascript ?? [],
    unusedCss: analysis.unused_css ?? [],
    pageMetrics: {
      totalSizeBytes: analysis.page_size_bytes ?? 0,
      totalRequests: analysis.request_count ?? 0,
    },
    structuredData: {
      hasStructuredData: analysis.has_structured_data ?? false,
      types: analysis.structured_data_types ?? [],
    },
    metaTags: {
      hasOpenGraph: Boolean(
        analysis.open_graph_tags?.ogTitle ??
          analysis.open_graph_tags?.ogDescription ??
          analysis.open_graph_tags?.ogImage
      ),
      hasTwitterCards: analysis.open_graph_tags?.hasTwitterCards ?? false,
      ogTitle: analysis.open_graph_tags?.ogTitle,
      ogDescription: analysis.open_graph_tags?.ogDescription,
      ogImage: analysis.open_graph_tags?.ogImage,
    },
    headingStructure: {
      h1: analysis.h1_tags ?? [],
      h2: analysis.h2_tags ?? [],
      h3: analysis.h3_tags ?? [],
      hasMultipleH1: (analysis.h1_tags?.length ?? 0) > 1,
    },
    colorContrastIssues: analysis.color_contrast_issues ?? [],
  };

  return { parseReport };
}
