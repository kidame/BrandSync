import {
  Smartphone,
  Monitor,
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SEOReportScores } from "../../types/seoReport";
import type { SEOReportPerformanceMetrics } from "../../types/seoReport";
import type { CoreWebVitalsMetrics } from "../../types/seoReport";

const SCORE_LABELS: Record<keyof SEOReportScores, string> = {
  seo: "SEO",
  performance: "Performance",
  accessibility: "Accessibilité",
  bestPractices: "Bonnes Pratiques",
};

const CWV_THRESHOLDS = {
  fcp: { good: 1800, medium: 3000 },
  lcp: { good: 2500, medium: 4000 },
  tbt: { good: 200, medium: 600 },
  cls: { good: 0.1, medium: 0.25 },
};

function metricsToRaw(m?: SEOReportPerformanceMetrics): CoreWebVitalsMetrics | undefined {
  if (!m) return undefined;
  return {
    fcp: m.fcp?.value ?? 0,
    lcp: m.lcp?.value ?? 0,
    tbt: m.tbt?.value ?? 0,
    cls: m.cls?.value ?? 0,
    si: m.speedIndex?.value ?? 0,
    tti: m.tti?.value ?? 0,
  };
}

function formatCWV(value: number, key: keyof CoreWebVitalsMetrics): string {
  if (key === "cls") return value.toFixed(2);
  return `${(value / 1000).toFixed(2)}s`;
}

function getCWVStatus(value: number, key: keyof CoreWebVitalsMetrics): "good" | "medium" | "poor" {
  const t = CWV_THRESHOLDS[key as keyof typeof CWV_THRESHOLDS];
  if (!t) return "good";
  if (key === "cls") {
    if (value <= t.good) return "good";
    if (value <= t.medium) return "medium";
    return "poor";
  }
  if (value <= t.good) return "good";
  if (value <= t.medium) return "medium";
  return "poor";
}

export interface ReportComparisonProps {
  mobileScores: SEOReportScores;
  desktopScores: SEOReportScores;
  mobileMetrics?: SEOReportPerformanceMetrics;
  desktopMetrics?: SEOReportPerformanceMetrics;
  websiteUrl?: string;
  aiAnalysis?: string | null;
  isLoadingAI?: boolean;
  onGenerateAI?: () => void;
  aiError?: string | null;
  imagesWithoutAltCount?: number;
  renderBlockingCount?: number;
  unusedJsBytes?: number;
}

export function ReportComparison({
  mobileScores,
  desktopScores,
  mobileMetrics,
  desktopMetrics,
  websiteUrl = "",
  aiAnalysis,
  isLoadingAI,
  onGenerateAI,
  aiError,
  imagesWithoutAltCount = 0,
  renderBlockingCount = 0,
  unusedJsBytes = 0,
}: ReportComparisonProps) {
  const mobileRaw = metricsToRaw(mobileMetrics);
  const desktopRaw = metricsToRaw(desktopMetrics);

  const categories = (Object.keys(SCORE_LABELS) as (keyof SEOReportScores)[]).map((key) => {
    const m = mobileScores[key];
    const d = desktopScores[key];
    const diff = d - m;
    let status: "better" | "worse" | "same" = "same";
    if (diff > 10) status = "better";
    else if (diff < -10) status = "worse";
    return {
      category: SCORE_LABELS[key],
      key,
      mobile: m,
      desktop: d,
      diff: diff > 0 ? `+${diff}` : String(diff),
      status,
    };
  });

  const avgMobile = Math.round(
    (mobileScores.seo + mobileScores.performance + mobileScores.accessibility + mobileScores.bestPractices) / 4
  );
  const avgDesktop = Math.round(
    (desktopScores.seo + desktopScores.performance + desktopScores.accessibility + desktopScores.bestPractices) / 4
  );

  const chartData = categories.map((c) => ({
    name: c.category,
    Mobile: c.mobile,
    Desktop: c.desktop,
  }));

  const cwvRows = [
    { key: "fcp" as const, label: "FCP (First Contentful Paint)", unit: "s", scale: 1000 },
    { key: "lcp" as const, label: "LCP (Largest Contentful Paint)", unit: "s", scale: 1000 },
    { key: "tbt" as const, label: "TBT (Total Blocking Time)", unit: "ms", scale: 1 },
    { key: "cls" as const, label: "CLS (Cumulative Layout Shift)", unit: "", scale: 1 },
    { key: "si" as const, label: "Speed Index", unit: "s", scale: 1000 },
    { key: "tti" as const, label: "TTI (Time to Interactive)", unit: "s", scale: 1000 },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1 : Tableau comparatif des scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Comparaison des scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 font-medium">Catégorie</th>
                  <th className="text-center p-3 font-medium">
                    <Smartphone className="h-4 w-4 inline-block mr-1" />
                    Mobile
                  </th>
                  <th className="text-center p-3 font-medium">
                    <Monitor className="h-4 w-4 inline-block mr-1" />
                    Desktop
                  </th>
                  <th className="text-center p-3 font-medium">Écart</th>
                  <th className="text-center p-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((row) => (
                  <tr key={row.key} className="border-b last:border-0">
                    <td className="p-3 font-medium">{row.category}</td>
                    <td className="p-3 text-center">{row.mobile}</td>
                    <td className="p-3 text-center">{row.desktop}</td>
                    <td className="p-3 text-center">{row.diff}</td>
                    <td className="p-3 text-center">
                      {row.status === "better" && (
                        <span className="text-green-600 flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4" /> Desktop meilleur
                        </span>
                      )}
                      {row.status === "worse" && (
                        <span className="text-red-600 flex items-center justify-center gap-1">
                          <TrendingDown className="h-4 w-4" /> Mobile à optimiser
                        </span>
                      )}
                      {row.status === "same" && (
                        <span className="text-muted-foreground flex items-center justify-center gap-1">
                          <Minus className="h-4 w-4" /> Similaire
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              Score moyen Mobile : <strong className="text-foreground">{avgMobile}/100</strong>
            </span>
            <span className="text-muted-foreground">
              Score moyen Desktop : <strong className="text-foreground">{avgDesktop}/100</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 : Graphique barres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scores Mobile vs Desktop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Mobile" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Desktop" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 : Core Web Vitals */}
      {(mobileRaw || desktopRaw) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Core Web Vitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-3 font-medium">Métrique</th>
                    <th className="text-center p-3 font-medium">Mobile</th>
                    <th className="text-center p-3 font-medium">Desktop</th>
                    <th className="text-center p-3 font-medium">Seuil « Bon »</th>
                    <th className="text-center p-3 font-medium">Statut M</th>
                    <th className="text-center p-3 font-medium">Statut D</th>
                  </tr>
                </thead>
                <tbody>
                  {cwvRows.map(({ key, label, unit, scale }) => {
                    const mv = mobileRaw?.[key] ?? 0;
                    const dv = desktopRaw?.[key] ?? 0;
                    const threshold = CWV_THRESHOLDS[key as keyof typeof CWV_THRESHOLDS];
                    const thresholdStr = threshold
                      ? key === "cls"
                        ? `< ${threshold.good}`
                        : `< ${threshold.good / 1000}s`
                      : "-";
                    const sm = getCWVStatus(mv, key);
                    const sd = getCWVStatus(dv, key);
                    const StatusBadge = ({ s }: { s: "good" | "medium" | "poor" }) => {
                      if (s === "good") return <span className="text-green-600">🟢</span>;
                      if (s === "medium") return <span className="text-amber-600">🟠</span>;
                      return <span className="text-red-600">🔴</span>;
                    };
                    return (
                      <tr key={key} className="border-b last:border-0">
                        <td className="p-3 font-medium">{label}</td>
                        <td className="p-3 text-center">
                          {mobileRaw ? formatCWV(mv, key) : "-"}
                        </td>
                        <td className="p-3 text-center">
                          {desktopRaw ? formatCWV(dv, key) : "-"}
                        </td>
                        <td className="p-3 text-center text-muted-foreground">{thresholdStr}</td>
                        <td className="p-3 text-center"><StatusBadge s={sm} /></td>
                        <td className="p-3 text-center"><StatusBadge s={sd} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4 : Analyse IA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Analyse intelligente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!aiAnalysis && !isLoadingAI && onGenerateAI && (
            <Button
              onClick={onGenerateAI}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Générer l'analyse IA
            </Button>
          )}
          {isLoadingAI && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Génération de l'analyse en cours...</span>
            </div>
          )}
          {aiError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {aiError}
            </div>
          )}
          {aiAnalysis && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{
                  __html: aiAnalysis
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\n/g, "<br />"),
                }}
              />
              {onGenerateAI && (
                <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onGenerateAI}>
                  Regénérer l'analyse
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
