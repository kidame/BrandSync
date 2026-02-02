import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Globe, Gauge, Eye, Shield, ExternalLink, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOScoreCard } from "./SEOScoreCard";
import { SEOChecklist } from "./SEOChecklist";
import { useSEOPdfExport } from "../../hooks/useSEOPdfExport";

export interface SEOAnalysis {
  id: string;
  territory_id: string;
  website_url: string;
  seo_score: number | null;
  performance_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  meta_description: string | null;
  has_meta_description: boolean;
  title_tag: string | null;
  has_viewport: boolean;
  is_crawlable: boolean;
  full_report: Record<string, unknown>;
  created_at: string;
  analyzed_at: string;
}

interface SEOAnalysisResultsProps {
  analysis: SEOAnalysis;
  projectName?: string;
}

export function SEOAnalysisResults({ analysis, projectName }: SEOAnalysisResultsProps) {
  const { exportToPdf } = useSEOPdfExport();

  const checkItems = [
    {
      label: "Meta description présente",
      passed: analysis.has_meta_description,
      description: analysis.has_meta_description
        ? "La page a une meta description"
        : "Ajoutez une meta description pour améliorer le SEO",
    },
    {
      label: "Titre de page présent",
      passed: Boolean(analysis.title_tag),
      description: analysis.title_tag || "Aucun titre de page détecté",
    },
    {
      label: "Viewport configuré",
      passed: analysis.has_viewport,
      description: analysis.has_viewport
        ? "Le site est optimisé pour mobile"
        : "Ajoutez une balise viewport pour le responsive",
    },
    {
      label: "Site crawlable",
      passed: analysis.is_crawlable,
      description: analysis.is_crawlable
        ? "Les moteurs de recherche peuvent indexer le site"
        : "Le site bloque l'indexation par les robots",
    },
  ];

  const handleExportPdf = () => {
    exportToPdf(analysis, projectName);
  };

  return (
    <div className="space-y-6">
      {/* Header with URL and timestamp */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base font-medium">
                  {analysis.website_url}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Analysé le {format(new Date(analysis.analyzed_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter PDF
              </Button>
              <a
                href={analysis.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Visiter le site
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SEOScoreCard
          title="SEO"
          score={analysis.seo_score ?? 0}
          icon={<Globe className="h-4 w-4 text-blue-500" />}
          description="Optimisation pour les moteurs de recherche"
        />
        <SEOScoreCard
          title="Performance"
          score={analysis.performance_score ?? 0}
          icon={<Gauge className="h-4 w-4 text-purple-500" />}
          description="Vitesse de chargement et réactivité"
        />
        <SEOScoreCard
          title="Accessibilité"
          score={analysis.accessibility_score ?? 0}
          icon={<Eye className="h-4 w-4 text-green-500" />}
          description="Accessibilité pour tous les utilisateurs"
        />
        <SEOScoreCard
          title="Bonnes Pratiques"
          score={analysis.best_practices_score ?? 0}
          icon={<Shield className="h-4 w-4 text-orange-500" />}
          description="Standards du web moderne"
        />
      </div>

      {/* Checklist */}
      <SEOChecklist items={checkItems} />

      {/* Overall score badge */}
      <div className="flex justify-center">
        <Badge
          variant="outline"
          className="text-lg py-2 px-6 font-semibold"
        >
          Score global: {Math.round(
            ((analysis.seo_score ?? 0) + 
             (analysis.performance_score ?? 0) + 
             (analysis.accessibility_score ?? 0) + 
             (analysis.best_practices_score ?? 0)) / 4
          )}/100
        </Badge>
      </div>
    </div>
  );
}
