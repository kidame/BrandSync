import { Gauge, Clock, MousePointer, LayoutDashboard, Zap, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { SEOReportPerformanceMetrics, PerformanceMetric } from "../../types/seoReport";

interface ReportPerformanceProps {
  metrics: SEOReportPerformanceMetrics;
  performanceScore: number;
}

export function ReportPerformance({ metrics, performanceScore }: ReportPerformanceProps) {
  const getStatusColor = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'good': return 'text-green-500 bg-green-100 dark:bg-green-950';
      case 'needs-improvement': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-950';
      case 'poor': return 'text-red-500 bg-red-100 dark:bg-red-950';
    }
  };

  const getStatusBadge = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'good': return <Badge className="bg-green-500">Bon</Badge>;
      case 'needs-improvement': return <Badge className="bg-yellow-500">Moyen</Badge>;
      case 'poor': return <Badge className="bg-red-500">Mauvais</Badge>;
    }
  };

  const metricItems = [
    {
      icon: Clock,
      key: 'fcp',
      label: 'First Contentful Paint (FCP)',
      description: 'Temps avant le premier rendu de contenu',
      metric: metrics.fcp,
      thresholds: '< 1.8s (Bon) | 1.8-3s (Moyen) | > 3s (Mauvais)',
    },
    {
      icon: LayoutDashboard,
      key: 'lcp',
      label: 'Largest Contentful Paint (LCP)',
      description: 'Temps de rendu du plus grand élément visible',
      metric: metrics.lcp,
      thresholds: '< 2.5s (Bon) | 2.5-4s (Moyen) | > 4s (Mauvais)',
    },
    {
      icon: MousePointer,
      key: 'tbt',
      label: 'Total Blocking Time (TBT)',
      description: 'Temps total de blocage du thread principal',
      metric: metrics.tbt,
      thresholds: '< 200ms (Bon) | 200-600ms (Moyen) | > 600ms (Mauvais)',
    },
    {
      icon: LayoutDashboard,
      key: 'cls',
      label: 'Cumulative Layout Shift (CLS)',
      description: 'Stabilité visuelle de la page',
      metric: metrics.cls,
      thresholds: '< 0.1 (Bon) | 0.1-0.25 (Moyen) | > 0.25 (Mauvais)',
    },
    {
      icon: Zap,
      key: 'speedIndex',
      label: 'Speed Index',
      description: 'Vitesse de rendu du contenu visible',
      metric: metrics.speedIndex,
      thresholds: '< 3.4s (Bon) | 3.4-5.8s (Moyen) | > 5.8s (Mauvais)',
    },
    {
      icon: Timer,
      key: 'tti',
      label: 'Time to Interactive (TTI)',
      description: 'Temps avant que la page soit entièrement interactive',
      metric: metrics.tti,
      thresholds: '< 3.8s (Bon) | 3.8-7.3s (Moyen) | > 7.3s (Mauvais)',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Gauge className="h-6 w-6" />
          Analyse de Performance
        </h2>
        <Badge variant={performanceScore >= 90 ? "default" : performanceScore >= 50 ? "secondary" : "destructive"}>
          Score: {performanceScore}/100
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metricItems.map((item) => (
          <Card key={item.key} className={getStatusColor(item.metric.status)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {getStatusBadge(item.metric.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {item.metric.displayValue}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {item.description}
              </p>
              <Progress value={item.metric.score * 100} className="h-1.5 mb-2" />
              <p className="text-xs text-muted-foreground">
                Seuils: {item.thresholds}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
