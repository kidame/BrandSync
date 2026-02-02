import { useState } from "react";
import { Download, Share2, FileText, BarChart3, Search, Gauge, Eye, Shield, Lightbulb, ClipboardList } from "lucide-react";
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

interface SEOReportViewerProps {
  analysis: SEOAnalysis;
  projectName?: string;
}

export function SEOReportViewer({ analysis, projectName }: SEOReportViewerProps) {
  const { parseReport } = useParseLighthouseReport();
  const { exportToPdf, isExporting } = useSEOProfessionalPdfExport();
  const [activeTab, setActiveTab] = useState("cover");

  const report = parseReport(analysis);

  const handleExportPdf = () => {
    exportToPdf(report, projectName);
  };

  const tabs = [
    { id: "cover", label: "Couverture", icon: FileText },
    { id: "summary", label: "Résumé", icon: BarChart3 },
    { id: "seo", label: "SEO", icon: Search },
    { id: "performance", label: "Performance", icon: Gauge },
    { id: "accessibility", label: "Accessibilité", icon: Eye },
    { id: "best-practices", label: "Bonnes Pratiques", icon: Shield },
    { id: "opportunities", label: "Opportunités", icon: Lightbulb },
    { id: "recommendations", label: "Recommandations", icon: ClipboardList },
  ];

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-sm text-muted-foreground">
          Rapport d'audit SEO professionnel
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
              metadata={report.metadata} 
              scores={report.scores} 
              projectName={projectName} 
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-0">
            <ReportSummary 
              scores={report.scores} 
              strengths={report.strengths}
              criticalIssues={report.criticalIssues}
            />
          </TabsContent>

          <TabsContent value="seo" className="mt-0">
            <ReportSEODetails 
              seoDetails={report.seoDetails} 
              seoScore={report.scores.seo}
            />
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            <ReportPerformance 
              metrics={report.performanceMetrics} 
              performanceScore={report.scores.performance}
            />
          </TabsContent>

          <TabsContent value="accessibility" className="mt-0">
            <ReportAccessibility 
              accessibility={report.accessibility}
              accessibilityScore={report.scores.accessibility}
            />
          </TabsContent>

          <TabsContent value="best-practices" className="mt-0">
            <ReportBestPractices 
              bestPractices={report.bestPractices}
              bestPracticesScore={report.scores.bestPractices}
            />
          </TabsContent>

          <TabsContent value="opportunities" className="mt-0">
            <ReportOpportunities opportunities={report.opportunities} />
          </TabsContent>

          <TabsContent value="recommendations" className="mt-0">
            <ReportRecommendations recommendations={report.recommendations} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
