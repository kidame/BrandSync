import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Globe, TrendingUp, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SEOReportMetadata, SEOReportScores } from "../../types/seoReport";

interface ReportCoverProps {
  metadata: SEOReportMetadata;
  scores: SEOReportScores;
  desktopScores?: SEOReportScores | null;
  projectName?: string;
}

export function ReportCover({ metadata, scores, desktopScores, projectName }: ReportCoverProps) {
  const getStatusConfig = (status: SEOReportMetadata['status']) => {
    switch (status) {
      case 'excellent':
        return { label: 'Excellent', color: 'bg-green-500', textColor: 'text-green-500' };
      case 'good':
        return { label: 'Bon', color: 'bg-blue-500', textColor: 'text-blue-500' };
      case 'needs-improvement':
        return { label: 'À améliorer', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
      case 'critical':
        return { label: 'Critique', color: 'bg-red-500', textColor: 'text-red-500' };
    }
  };

  const statusConfig = getStatusConfig(metadata.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <TrendingUp className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Audit SEO & Performance Web</h1>
        </div>
        {projectName && (
          <p className="text-muted-foreground">Projet: {projectName}</p>
        )}
      </div>

      {/* URL Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Site analysé</p>
              <p className="font-medium truncate">{metadata.url}</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Analysé le {format(new Date(metadata.analyzedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
          </div>
        </CardContent>
      </Card>

      {/* Score Global */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${statusConfig.color}`} />
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full border-8 ${statusConfig.color} border-opacity-20 flex items-center justify-center`}>
                  <span className={`text-3xl font-bold ${statusConfig.textColor}`}>
                    {metadata.overallScore}
                  </span>
                </div>
                <Award className={`absolute -bottom-1 -right-1 h-8 w-8 ${statusConfig.textColor}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Score Global</h2>
                <Badge className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Mini scores (Mobile, ou Mobile + Desktop) */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
            {[
              { label: 'SEO', key: 'seo' as const },
              { label: 'Performance', key: 'performance' as const },
              { label: 'Accessibilité', key: 'accessibility' as const },
              { label: 'Bonnes Pratiques', key: 'bestPractices' as const },
            ].map(({ label, key }) => (
              <div key={label} className="text-center">
                <div className={`text-2xl font-bold ${
                  scores[key] >= 90 ? 'text-green-500' :
                  scores[key] >= 70 ? 'text-blue-500' :
                  scores[key] >= 50 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {scores[key]}
                  {desktopScores && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      / {desktopScores[key]}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {label}
                  {desktopScores && <span className="block">M / D</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
