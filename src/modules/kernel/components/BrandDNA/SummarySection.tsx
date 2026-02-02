import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Image, FileText, Calendar, Activity } from "lucide-react";
import type { BrandSummary } from "@/modules/shared/types";
import { AIEstimationBadge, AIEstimationAlert } from "./AIEstimationBadge";

interface SummarySectionProps {
  summary: BrandSummary;
  territoryName: string;
}

export function SummarySection({ summary, territoryName }: SummarySectionProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CH', { 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.6) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (score < 0.4) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.7) return 'Très positif';
    if (score > 0.5) return 'Positif';
    if (score > 0.3) return 'Neutre';
    return 'Négatif';
  };

  return (
    <section className="space-y-6">
      {/* Data reliability notice */}
      <AIEstimationAlert 
        reliability="mixed" 
        details="Le titre, la description et les insights sont générés par IA à partir des données réelles. Les statistiques (posts, images) sont réelles."
      />

      {/* Hero Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(summary.dateRange.start)} — {formatDate(summary.dateRange.end)}
              </span>
            </div>
            <AIEstimationBadge reliability="mixed" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold leading-tight">
            {summary.headline}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed mb-6">
            {summary.description}
          </p>
          
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-background/80 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Posts</span>
              </div>
              <p className="text-2xl font-bold">{summary.totalPosts.toLocaleString('fr-CH')}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/80 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Image className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Images</span>
              </div>
              <p className="text-2xl font-bold">{summary.totalImages.toLocaleString('fr-CH')}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/80 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {getSentimentIcon(summary.sentimentScore)}
                <span className="text-xs uppercase tracking-wide">Sentiment</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{Math.round(summary.sentimentScore * 100)}%</p>
                <Badge variant="secondary" className="text-xs">
                  {getSentimentLabel(summary.sentimentScore)}
                </Badge>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-background/80 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Activity className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Engagement</span>
              </div>
              <p className="text-2xl font-bold">{summary.engagementRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Insights clés</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {summary.keyInsights.map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Sentiment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score de sentiment global</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Perception de {territoryName}</span>
              <span className="font-medium">{Math.round(summary.sentimentScore * 100)}%</span>
            </div>
            <Progress value={summary.sentimentScore * 100} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Négatif</span>
              <span>Positif</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
