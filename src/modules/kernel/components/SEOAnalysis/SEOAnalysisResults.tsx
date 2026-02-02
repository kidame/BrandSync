import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Globe, Gauge, Eye, Shield, ExternalLink, Download, Smartphone, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOScoreCard } from "./SEOScoreCard";
import { SEOChecklist } from "./SEOChecklist";
import { useSEOPdfExport } from "../../hooks/useSEOPdfExport";

/** Scores desktop (mobile = colonnes seo_score, etc.) */
export interface DesktopScores {
  seo: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
}

export interface SEOAnalysis {
  id: string;
  territory_id: string;
  website_url: string;
  seo_score: number | null;
  performance_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  /** Scores desktop (si analyse mobile + desktop) */
  desktop_scores?: DesktopScores | null;
  meta_description: string | null;
  has_meta_description: boolean;
  title_tag: string | null;
  has_viewport: boolean;
  is_crawlable: boolean;
  full_report: Record<string, unknown>;
  full_report_desktop?: Record<string, unknown> | null;
  created_at: string;
  analyzed_at: string;
  // Données extraites (optionnel, rétrocompat)
  images_without_alt?: Array<{ src: string; snippet?: string; selector?: string }>;
  links_without_text?: Array<{ href?: string; snippet?: string; selector?: string }>;
  render_blocking_resources?: Array<{ url: string; totalBytes?: number; wastedMs?: number }>;
  unused_javascript?: Array<{ url: string; totalBytes?: number; wastedBytes?: number }>;
  unused_css?: Array<{ url: string; totalBytes?: number; wastedBytes?: number }>;
  page_size_bytes?: number | null;
  request_count?: number | null;
  has_sitemap?: boolean | null;
  has_robots_txt?: boolean | null;
  has_structured_data?: boolean | null;
  structured_data_types?: string[];
  open_graph_tags?: { ogTitle?: string; ogDescription?: string; ogImage?: string; hasTwitterCards?: boolean } | null;
  h1_tags?: string[];
  h2_tags?: string[];
  h3_tags?: string[];
  color_contrast_issues?: Array<{ element?: string; snippet?: string; contrastRatio?: number; expectedRatio?: number }>;
}

interface SEOAnalysisResultsProps {
  analysis: SEOAnalysis;
  projectName?: string;
}

type DeviceView = "mobile" | "desktop";

export function SEOAnalysisResults({ analysis, projectName }: SEOAnalysisResultsProps) {
  const { exportToPdf } = useSEOPdfExport();
  const hasDesktop = Boolean(analysis.desktop_scores);
  const [deviceView, setDeviceView] = useState<DeviceView>("mobile");

  const mobileScores = {
    seo: analysis.seo_score ?? 0,
    performance: analysis.performance_score ?? 0,
    accessibility: analysis.accessibility_score ?? 0,
    bestPractices: analysis.best_practices_score ?? 0,
  };
  const desktopScores = analysis.desktop_scores ?? mobileScores;
  const activeScores = deviceView === "desktop" ? desktopScores : mobileScores;
  const overallActive = Math.round(
    (activeScores.seo + activeScores.performance + activeScores.accessibility + activeScores.bestPractices) / 4
  );

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

      {/* Toggle Mobile / Desktop (visible uniquement pour les analyses avec scores desktop) */}
      {hasDesktop ? (
        <Tabs value={deviceView} onValueChange={(v) => setDeviceView(v as DeviceView)}>
          <TabsList className="grid w-full max-w-xs grid-cols-2">
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
      ) : (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Smartphone className="h-4 w-4 shrink-0" />
          Affichage Mobile. Pour comparer Mobile et Desktop, lancez une <strong>nouvelle analyse</strong> (les anciennes n’ont pas les scores desktop).
        </p>
      )}

      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SEOScoreCard
          title="SEO"
          score={activeScores.seo}
          icon={<Globe className="h-4 w-4 text-blue-500" />}
          description="Optimisation pour les moteurs de recherche"
        />
        <SEOScoreCard
          title="Performance"
          score={activeScores.performance}
          icon={<Gauge className="h-4 w-4 text-purple-500" />}
          description="Vitesse de chargement et réactivité"
        />
        <SEOScoreCard
          title="Accessibilité"
          score={activeScores.accessibility}
          icon={<Eye className="h-4 w-4 text-green-500" />}
          description="Accessibilité pour tous les utilisateurs"
        />
        <SEOScoreCard
          title="Bonnes Pratiques"
          score={activeScores.bestPractices}
          icon={<Shield className="h-4 w-4 text-orange-500" />}
          description="Standards du web moderne"
        />
      </div>

      {/* Comparaison Mobile vs Desktop (barres côte à côte) */}
      {hasDesktop && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comparaison Mobile / Desktop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["seo", "performance", "accessibility", "bestPractices"] as const).map((key) => {
              const labels: Record<typeof key, string> = {
                seo: "SEO",
                performance: "Performance",
                accessibility: "Accessibilité",
                bestPractices: "Bonnes Pratiques",
              };
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-muted-foreground">{labels[key]}</span>
                  <div className="flex-1 flex gap-1 h-6 rounded overflow-hidden bg-muted">
                    <div
                      className="bg-blue-500 shrink-0"
                      style={{ width: `${mobileScores[key]}%` }}
                      title={`Mobile: ${mobileScores[key]}`}
                    />
                    <div
                      className="bg-violet-500 shrink-0"
                      style={{ width: `${desktopScores[key]}%` }}
                      title={`Desktop: ${desktopScores[key]}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-20">
                    M {mobileScores[key]} / D {desktopScores[key]}
                  </span>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground mt-2">
              Bleu = Mobile, Violet = Desktop
            </p>
          </CardContent>
        </Card>
      )}

      {/* Checklist */}
      <SEOChecklist items={checkItems} />

      {/* Overall score badge */}
      <div className="flex justify-center">
        <Badge
          variant="outline"
          className="text-lg py-2 px-6 font-semibold"
        >
          Score global ({deviceView}) : {overallActive}/100
        </Badge>
      </div>
    </div>
  );
}
