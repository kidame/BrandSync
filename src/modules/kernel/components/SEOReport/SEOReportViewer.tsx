import { useState, useEffect } from "react";
import {
  Download,
  Share2,
  FileText,
  BarChart3,
  Search,
  Gauge,
  Eye,
  Shield,
  Lightbulb,
  ClipboardList,
  Image,
  Link2,
  Package,
  Code2,
  Heading,
  Smartphone,
  Monitor,
  GitCompare,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SEOAnalysis } from "../SEOAnalysis/SEOAnalysisResults";
import { useParseLighthouseReport } from "../../hooks/useParseLighthouseReport";
import { useSEOProfessionalPdfExport } from "../../hooks/useSEOProfessionalPdfExport";
import { ReportCover } from "./ReportCover";
import { ReportSummary } from "./ReportSummary";
import { ReportSEODetails } from "./ReportSEODetails";
import { ReportPerformance } from "./ReportPerformance";
import { ReportAccessibility } from "./ReportAccessibility";
import { ReportBestPractices } from "./ReportBestPractices";
import { ReportOpportunities } from "./ReportOpportunities";
import { ReportRecommendations } from "./ReportRecommendations";
import { ReportImagesAudit } from "./ReportImagesAudit";
import { ReportLinksAudit } from "./ReportLinksAudit";
import { ReportResourcesAudit } from "./ReportResourcesAudit";
import { ReportStructuredData } from "./ReportStructuredData";
import { ReportHeadingStructure } from "./ReportHeadingStructure";
import { ReportComparison } from "./ReportComparison";
import { useAIComparison } from "../../hooks/useAIComparison";
import type { AnalyzeSEOComparisonPayload, CoreWebVitalsMetrics } from "../../types/seoReport";

interface SEOReportViewerProps {
  analysis: SEOAnalysis;
  projectName?: string;
}

type DeviceView = "mobile" | "desktop";

export function SEOReportViewer({ analysis, projectName }: SEOReportViewerProps) {
  const { parseReport } = useParseLighthouseReport();
  const { exportToPdf, isExporting } = useSEOProfessionalPdfExport();
  const [activeTab, setActiveTab] = useState("cover");
  const [deviceView, setDeviceView] = useState<DeviceView>("mobile");

  const { report, reportDesktop } = parseReport(analysis);
  const hasDesktop = Boolean(reportDesktop);
  const displayReport = deviceView === "desktop" && reportDesktop ? reportDesktop : report;

  const {
    analysis: aiAnalysis,
    isLoading: isLoadingAI,
    error: aiError,
    generateAnalysis: generateAIAnalysis,
    reset: resetAIAnalysis,
  } = useAIComparison();

  useEffect(() => {
    resetAIAnalysis();
  }, [analysis.id, analysis.website_url, resetAIAnalysis]);

  const perfToCWV = (m: typeof report.performanceMetrics): CoreWebVitalsMetrics => ({
    fcp: m.fcp?.value ?? 0,
    lcp: m.lcp?.value ?? 0,
    tbt: m.tbt?.value ?? 0,
    cls: m.cls?.value ?? 0,
    si: m.speedIndex?.value ?? 0,
    tti: m.tti?.value ?? 0,
  });

  const handleGenerateAI = () => {
    if (!reportDesktop) return;
    const payload: AnalyzeSEOComparisonPayload = {
      website_url: report.metadata.url,
      mobile_scores: report.scores,
      desktop_scores: reportDesktop.scores,
      mobile_metrics: perfToCWV(report.performanceMetrics),
      desktop_metrics: perfToCWV(reportDesktop.performanceMetrics),
      images_without_alt_count: report.extendedData?.imagesWithoutAlt?.length ?? 0,
      render_blocking_count: report.extendedData?.renderBlockingResources?.length ?? 0,
      unused_js_bytes: report.extendedData?.unusedJavascript?.reduce((s, u) => s + (u.wastedBytes ?? 0), 0) || undefined,
    };
    generateAIAnalysis(payload);
  };

  const handleExportPdf = () => {
    exportToPdf(displayReport, projectName);
  };

  const hasExtended = Boolean(displayReport.extendedData);
  const tabs = [
    { id: "cover", label: "Couverture", icon: FileText },
    { id: "summary", label: "Résumé", icon: BarChart3 },
    ...(hasDesktop ? [{ id: "comparison" as const, label: "Comparatif", icon: GitCompare }] : []),
    { id: "seo", label: "SEO", icon: Search },
    { id: "performance", label: "Performance", icon: Gauge },
    { id: "accessibility", label: "Accessibilité", icon: Eye },
    { id: "best-practices", label: "Bonnes Pratiques", icon: Shield },
    ...(hasExtended
      ? [
          { id: "images", label: "Images", icon: Image },
          { id: "links", label: "Liens", icon: Link2 },
          { id: "resources", label: "Ressources", icon: Package },
          { id: "structured-data", label: "Données structurées", icon: Code2 },
          { id: "headings", label: "Structure titres", icon: Heading },
        ]
      : []),
    { id: "opportunities", label: "Opportunités", icon: Lightbulb },
    { id: "recommendations", label: "Recommandations", icon: ClipboardList },
  ];

  return (
    <div className="space-y-4">
      {/* Ligne 1 : Titre + vue actuelle + boutons */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            Rapport d'audit SEO professionnel
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
            title={hasDesktop ? "Choisir Mobile ou Desktop ci-dessous" : "Vue Mobile uniquement"}
          >
            {hasDesktop ? (
              deviceView === "desktop" ? (
                <><Monitor className="h-3.5 w-3.5" /> Vue Desktop</>
              ) : (
                <><Smartphone className="h-3.5 w-3.5" /> Vue Mobile</>
              )
            ) : (
              <><Smartphone className="h-3.5 w-3.5" /> Vue Mobile</>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Génération..." : "Télécharger PDF"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Share2 className="h-4 w-4" />
            Partager
          </Button>
        </div>
      </div>

      {/* Ligne 2 : Choix Mobile / Desktop — toujours visible */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border-2 border-primary/20 bg-card shadow-sm">
        <span className="text-sm font-semibold text-foreground shrink-0">Choisir la vue :</span>
        {hasDesktop ? (
          <>
            <Tabs
              value={deviceView}
              onValueChange={(v) => setDeviceView(v as DeviceView)}
              className="w-auto"
            >
              <TabsList className="grid grid-cols-2 h-10 bg-muted">
                <TabsTrigger value="mobile" className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile
                </TabsTrigger>
                <TabsTrigger value="desktop" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-xs text-muted-foreground">
              {deviceView === "desktop"
                ? "Rapport complet issu de l’audit Desktop (scores, métriques, opportunités)."
                : "Rapport complet issu de l’audit Mobile."}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            Vue Mobile uniquement. Lancez une <strong>nouvelle analyse</strong> pour obtenir une vue Desktop distincte.
          </span>
        )}
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-full justify-start gap-1 bg-transparent p-0 mb-4">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <div className="min-h-[500px]">
          <TabsContent value="cover" className="mt-0">
            <ReportCover
              metadata={displayReport.metadata}
              scores={displayReport.scores}
              desktopScores={hasDesktop && reportDesktop ? (deviceView === "desktop" ? report.scores : reportDesktop.scores) : undefined}
              projectName={projectName}
              deviceView={deviceView}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-0">
            <ReportSummary 
              scores={displayReport.scores} 
              strengths={displayReport.strengths}
              criticalIssues={displayReport.criticalIssues}
            />
          </TabsContent>

          {hasDesktop && reportDesktop && (
            <TabsContent value="comparison" className="mt-0">
              <ReportComparison
                mobileScores={report.scores}
                desktopScores={reportDesktop.scores}
                mobileMetrics={report.performanceMetrics}
                desktopMetrics={reportDesktop.performanceMetrics}
                websiteUrl={report.metadata.url}
                aiAnalysis={aiAnalysis}
                isLoadingAI={isLoadingAI}
                onGenerateAI={handleGenerateAI}
                aiError={aiError}
                imagesWithoutAltCount={report.extendedData?.imagesWithoutAlt?.length ?? 0}
                renderBlockingCount={report.extendedData?.renderBlockingResources?.length ?? 0}
                unusedJsBytes={report.extendedData?.unusedJavascript?.reduce((s, u) => s + (u.wastedBytes ?? 0), 0)}
              />
            </TabsContent>
          )}

          <TabsContent value="seo" className="mt-0">
            <ReportSEODetails 
              seoDetails={displayReport.seoDetails} 
              seoScore={displayReport.scores.seo}
            />
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            <ReportPerformance 
              metrics={displayReport.performanceMetrics} 
              performanceScore={displayReport.scores.performance}
            />
          </TabsContent>

          <TabsContent value="accessibility" className="mt-0">
            <ReportAccessibility 
              accessibility={displayReport.accessibility}
              accessibilityScore={displayReport.scores.accessibility}
            />
          </TabsContent>

          <TabsContent value="best-practices" className="mt-0">
            <ReportBestPractices 
              bestPractices={displayReport.bestPractices}
              bestPracticesScore={displayReport.scores.bestPractices}
            />
          </TabsContent>

          <TabsContent value="opportunities" className="mt-0">
            <ReportOpportunities opportunities={displayReport.opportunities} />
          </TabsContent>

          {hasExtended && displayReport.extendedData && (
            <>
              <TabsContent value="images" className="mt-0">
                <ReportImagesAudit imagesWithoutAlt={displayReport.extendedData.imagesWithoutAlt} />
              </TabsContent>
              <TabsContent value="links" className="mt-0">
                <ReportLinksAudit linksWithoutText={displayReport.extendedData.linksWithoutText} />
              </TabsContent>
              <TabsContent value="resources" className="mt-0">
                <ReportResourcesAudit
                  pageMetrics={displayReport.extendedData.pageMetrics}
                  renderBlockingResources={displayReport.extendedData.renderBlockingResources}
                  unusedJavascript={displayReport.extendedData.unusedJavascript}
                  unusedCss={displayReport.extendedData.unusedCss}
                />
              </TabsContent>
              <TabsContent value="structured-data" className="mt-0">
                <ReportStructuredData
                  structuredData={displayReport.extendedData.structuredData}
                  metaTags={displayReport.extendedData.metaTags}
                />
              </TabsContent>
              <TabsContent value="headings" className="mt-0">
                <ReportHeadingStructure headingStructure={displayReport.extendedData.headingStructure} />
              </TabsContent>
            </>
          )}
          <TabsContent value="recommendations" className="mt-0">
            <ReportRecommendations recommendations={displayReport.recommendations} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
