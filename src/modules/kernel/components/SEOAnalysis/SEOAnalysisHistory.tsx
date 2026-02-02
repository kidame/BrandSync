import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History, ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SEOAnalysis } from "./SEOAnalysisResults";

interface SEOAnalysisHistoryProps {
  analyses: SEOAnalysis[];
  onSelect: (analysis: SEOAnalysis) => void;
  onDelete?: (id: string) => void;
  selectedId?: string;
}

function getScoreBadgeVariant(score: number | null): "default" | "secondary" | "destructive" {
  if (score === null) return "secondary";
  if (score >= 90) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

export function SEOAnalysisHistory({ analyses, onSelect, onDelete, selectedId }: SEOAnalysisHistoryProps) {
  if (analyses.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Historique des analyses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {analyses.map((analysis) => {
          const avgScore = Math.round(
            ((analysis.seo_score ?? 0) +
              (analysis.performance_score ?? 0) +
              (analysis.accessibility_score ?? 0) +
              (analysis.best_practices_score ?? 0)) / 4
          );

          return (
            <div
              key={analysis.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                selectedId === analysis.id && "bg-muted border-primary"
              )}
              onClick={() => onSelect(analysis)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate max-w-[200px]">
                    {new URL(analysis.website_url).hostname}
                  </span>
                  <Badge variant={getScoreBadgeVariant(avgScore)} className="shrink-0">
                    {avgScore}/100
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(analysis.analyzed_at), "d MMM yyyy, HH:mm", { locale: fr })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(analysis.website_url, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(analysis.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
