import { TrendingUp, TrendingDown, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SEOReportScores } from "../../types/seoReport";

interface ReportSummaryProps {
  scores: SEOReportScores;
  strengths: string[];
  criticalIssues: string[];
}

export function ReportSummary({ scores, strengths, criticalIssues }: ReportSummaryProps) {
  const scoreItems = [
    { label: 'SEO', score: scores.seo, color: 'bg-blue-500' },
    { label: 'Performance', score: scores.performance, color: 'bg-purple-500' },
    { label: 'Accessibilité', score: scores.accessibility, color: 'bg-green-500' },
    { label: 'Bonnes Pratiques', score: scores.bestPractices, color: 'bg-orange-500' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Résumé Exécutif</h2>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scoreItems.map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{item.label}</span>
                <span className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                  {item.score}/100
                </span>
              </div>
              <Progress 
                value={item.score} 
                className="h-2"
              />
              <div className={`h-1 mt-1 rounded-full ${getProgressColor(item.score)}`} 
                   style={{ width: `${item.score}%` }} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Strengths & Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 3 Points forts */}
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
              <TrendingUp className="h-5 w-5" />
              Top 3 Points Forts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {strengths.length > 0 ? (
              strengths.slice(0, 3).map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucun point fort identifié</p>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Points critiques */}
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
              <TrendingDown className="h-5 w-5" />
              Top 3 Points Critiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalIssues.length > 0 ? (
              criticalIssues.slice(0, 3).map((issue, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{issue}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucun problème critique détecté</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
