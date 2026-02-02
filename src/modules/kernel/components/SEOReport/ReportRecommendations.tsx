import { ClipboardList, ArrowUp, ArrowRight, ArrowDown, Zap, Clock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SEORecommendation } from "../../types/seoReport";

interface ReportRecommendationsProps {
  recommendations: SEORecommendation[];
}

export function ReportRecommendations({ recommendations }: ReportRecommendationsProps) {
  const getPriorityConfig = (priority: SEORecommendation['priority']) => {
    switch (priority) {
      case 'critical':
        return { label: 'Critique', color: 'bg-red-500', icon: ArrowUp };
      case 'high':
        return { label: 'Haute', color: 'bg-orange-500', icon: ArrowUp };
      case 'medium':
        return { label: 'Moyenne', color: 'bg-yellow-500', icon: ArrowRight };
      case 'low':
        return { label: 'Basse', color: 'bg-blue-500', icon: ArrowDown };
    }
  };

  const getEffortConfig = (effort: SEORecommendation['effort']) => {
    switch (effort) {
      case 'low':
        return { label: 'Faible', icon: Zap, color: 'text-green-500' };
      case 'medium':
        return { label: 'Moyen', icon: Clock, color: 'text-yellow-500' };
      case 'high':
        return { label: 'Élevé', icon: Target, color: 'text-red-500' };
    }
  };

  const getCategoryLabel = (category: SEORecommendation['category']) => {
    switch (category) {
      case 'seo': return 'SEO';
      case 'performance': return 'Performance';
      case 'accessibility': return 'Accessibilité';
      case 'best-practices': return 'Bonnes Pratiques';
    }
  };

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Recommandations Prioritaires
        </h2>
        <Badge variant="outline">
          {recommendations.length} action(s)
        </Badge>
      </div>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Excellent travail !</p>
            <p className="text-sm">Aucune recommandation prioritaire identifiée</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan d'action</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problème</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Effort</TableHead>
                  <TableHead className="text-right">Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRecommendations.map((rec, idx) => {
                  const priorityConfig = getPriorityConfig(rec.priority);
                  const effortConfig = getEffortConfig(rec.effort);
                  const PriorityIcon = priorityConfig.icon;
                  const EffortIcon = effortConfig.icon;

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium max-w-[300px]">
                        <span className="line-clamp-2">{rec.problem}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCategoryLabel(rec.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityConfig.color}>
                          <PriorityIcon className="h-3 w-3 mr-1" />
                          {priorityConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${effortConfig.color}`}>
                          <EffortIcon className="h-4 w-4" />
                          <span className="text-sm">{effortConfig.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">+{rec.impact} pts</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="font-medium mr-2">Priorité:</span>
              <Badge className="bg-red-500 mr-1">Critique</Badge>
              <Badge className="bg-orange-500 mr-1">Haute</Badge>
              <Badge className="bg-yellow-500 mr-1">Moyenne</Badge>
              <Badge className="bg-blue-500">Basse</Badge>
            </div>
            <div>
              <span className="font-medium mr-2">Effort:</span>
              <span className="text-green-500 mr-2">⚡ Faible</span>
              <span className="text-yellow-500 mr-2">🕐 Moyen</span>
              <span className="text-red-500">🎯 Élevé</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
