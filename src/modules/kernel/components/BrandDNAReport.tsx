import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  Share2, 
  MapPin, 
  Calendar,
  FileText,
  Palette,
  MessageSquare,
  Users,
  Lightbulb,
  AlertCircle,
  FolderKanban,
  Loader2
} from "lucide-react";
import { 
  SummarySection, 
  VisualIdentitySection, 
  SemanticProfileSection,
  AudienceMatrixSection,
  RecommendationsSection 
} from "./BrandDNA";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/modules/shared/hooks/useProjects";
import { useBrandDNAPdfExport } from "@/modules/kernel/hooks/useBrandDNAPdfExport";
import { toast } from "sonner";
import type { 
  BrandDNAReport as BrandDNAReportType,
  BrandSummary,
  VisualIdentity,
  SemanticProfile,
  AudienceMatrix,
  Recommendation
} from "@/modules/shared/types";

interface DBReport {
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
}

// Default values for visual identity when data is missing
const defaultVisualIdentity: VisualIdentity = {
  dominantColors: { primary: [], secondary: [], accent: [] },
  sceneCategories: [],
  visualThemes: [],
  moodBoard: []
};

// Default values for semantic profile when data is missing
const defaultSemanticProfile: SemanticProfile = {
  topics: [],
  sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
  emotionalTones: [],
  keyPhrases: [],
  narrativeThemes: []
};

// Default values for audience matrix when data is missing
const defaultAudienceMatrix: AudienceMatrix = {
  tribes: [],
  overlapMatrix: [],
  totalReach: 0
};

function transformDBReportToType(dbReport: DBReport): BrandDNAReportType {
  const summary = (dbReport.summary as Record<string, unknown>) || {};
  const visualIdentity = (dbReport.visual_identity as Record<string, unknown>) || {};
  const semanticProfile = (dbReport.semantic_profile as Record<string, unknown>) || {};
  const audienceMatrix = (dbReport.audience_matrix as Record<string, unknown>) || {};
  
  return {
    id: dbReport.id,
    territoryId: dbReport.territory_id,
    generatedAt: new Date(dbReport.generated_at),
    summary: {
      headline: (summary.headline as string) || 'Rapport Brand DNA',
      description: (summary.description as string) || '',
      keyInsights: (summary.keyInsights as string[]) || [],
      sentimentScore: dbReport.sentiment_score || (summary.sentimentScore as number) || 0,
      engagementRate: dbReport.engagement_rate || (summary.engagementRate as number) || 0,
      totalPosts: dbReport.total_posts,
      totalImages: dbReport.total_images,
      dateRange: {
        start: new Date(dbReport.analysis_period_start),
        end: new Date(dbReport.analysis_period_end)
      }
    } as BrandSummary,
    visualIdentity: {
      ...defaultVisualIdentity,
      ...visualIdentity,
      dominantColors: {
        primary: (visualIdentity.dominantColors as Record<string, unknown>)?.primary || [],
        secondary: (visualIdentity.dominantColors as Record<string, unknown>)?.secondary || [],
        accent: (visualIdentity.dominantColors as Record<string, unknown>)?.accent || []
      }
    } as VisualIdentity,
    semanticProfile: {
      ...defaultSemanticProfile,
      ...semanticProfile,
      sentimentDistribution: (semanticProfile.sentimentDistribution as SemanticProfile['sentimentDistribution']) || defaultSemanticProfile.sentimentDistribution
    } as SemanticProfile,
    audienceMatrix: {
      ...defaultAudienceMatrix,
      ...audienceMatrix
    } as AudienceMatrix,
    recommendations: (dbReport.recommendations as Recommendation[]) || []
  };
}

export function BrandDNAReport() {
  const { selectedProject, loading: projectsLoading } = useProjects();
  const [report, setReport] = useState<BrandDNAReportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const { exportToPdf } = useBrandDNAPdfExport();

  const handleExportPdf = async () => {
    if (!report || !selectedProject) return;
    
    setExporting(true);
    try {
      await exportToPdf({
        report,
        projectName: selectedProject.name,
        projectRegion: selectedProject.region,
        projectCountry: selectedProject.country
      });
      toast.success("PDF exporté avec succès");
    } catch (err) {
      console.error("Error exporting PDF:", err);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };
  useEffect(() => {
    async function loadReport() {
      if (!selectedProject) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get latest Brand DNA report for the selected project
        const { data: reports, error: reportError } = await supabase
          .from("brand_dna_reports")
          .select("*")
          .eq("territory_id", selectedProject.id)
          .order("generated_at", { ascending: false })
          .limit(1);

        if (reportError) throw reportError;

        if (reports && reports.length > 0) {
          const transformedReport = transformDBReportToType(reports[0] as DBReport);
          setReport(transformedReport);
        } else {
          setReport(null);
          setError("Aucun rapport Brand DNA disponible. Lancez une collecte de données puis générez un rapport.");
        }
      } catch (err) {
        console.error("Error loading Brand DNA data:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [selectedProject]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CH', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  if (projectsLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </main>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Aucun projet sélectionné</h2>
          <p className="text-muted-foreground mb-4">
            Sélectionnez un projet dans la barre latérale pour voir son rapport Brand DNA.
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">
            {error || "Aucun rapport disponible"}
          </h2>
          <p className="text-muted-foreground mb-4">
            Collectez des données Instagram puis générez un Brand DNA Report depuis la page Data Collection.
          </p>
          <Button asChild>
            <a href="/kernel/data">Aller à Data Collection</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MapPin className="h-4 w-4" />
                <span>{selectedProject.region}, {selectedProject.country}</span>
              </div>
              <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Brand DNA Report
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Généré le {formatDate(report.generatedAt)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
              <Button size="sm" onClick={handleExportPdf} disabled={exporting}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {exporting ? "Export..." : "Exporter PDF"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Synthèse</span>
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Visuel</span>
            </TabsTrigger>
            <TabsTrigger value="semantic" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Sémantique</span>
            </TabsTrigger>
            <TabsTrigger value="audience" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Audience</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <SummarySection 
              summary={report.summary} 
              territoryName={selectedProject.name}
            />
          </TabsContent>

          <TabsContent value="visual">
            <VisualIdentitySection 
              visualIdentity={report.visualIdentity} 
            />
          </TabsContent>

          <TabsContent value="semantic">
            <SemanticProfileSection 
              semanticProfile={report.semanticProfile} 
            />
          </TabsContent>

          <TabsContent value="audience">
            <AudienceMatrixSection 
              audienceMatrix={report.audienceMatrix} 
            />
          </TabsContent>

          <TabsContent value="recommendations">
            <RecommendationsSection 
              recommendations={report.recommendations} 
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
