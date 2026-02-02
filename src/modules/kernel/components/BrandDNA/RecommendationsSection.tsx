import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lightbulb, Target, Clock, Users, Palette } from "lucide-react";
import type { Recommendation } from "@/modules/shared/types";
import { AIEstimationBadge, AIEstimationAlert } from "./AIEstimationBadge";

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
}

export function RecommendationsSection({ recommendations }: RecommendationsSectionProps) {
  const getCategoryIcon = (category: Recommendation['category']) => {
    switch (category) {
      case 'content': return Lightbulb;
      case 'visual': return Palette;
      case 'engagement': return Target;
      case 'timing': return Clock;
      case 'audience': return Users;
      default: return Lightbulb;
    }
  };

  const getCategoryLabel = (category: Recommendation['category']) => {
    switch (category) {
      case 'content': return 'Contenu';
      case 'visual': return 'Visuel';
      case 'engagement': return 'Engagement';
      case 'timing': return 'Timing';
      case 'audience': return 'Audience';
      default: return category;
    }
  };

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'low': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high': return 'Priorité haute';
      case 'medium': return 'Priorité moyenne';
      case 'low': return 'Priorité basse';
      default: return priority;
    }
  };

  // Sort by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <section className="space-y-6">
      {/* Data reliability notice */}
      <AIEstimationAlert 
        reliability="mixed" 
        details="Les recommandations sont générées par l'IA en se basant sur l'analyse des données collectées. À valider selon votre contexte spécifique."
      />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recommandations Stratégiques</h2>
        <div className="flex items-center gap-2">
          <AIEstimationBadge reliability="mixed" />
          <Badge variant="outline">{recommendations.length} actions</Badge>
        </div>
      </div>

      <div className="space-y-4">
        {sortedRecommendations.map((rec) => {
          const Icon = getCategoryIcon(rec.category);
          
          return (
            <Card key={rec.id} className="overflow-hidden">
              <div className={`h-1 ${
                rec.priority === 'high' ? 'bg-destructive' : 
                rec.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{rec.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                      {getPriorityLabel(rec.priority)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryLabel(rec.category)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Action Items */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Actions à entreprendre</h5>
                  <ul className="space-y-2">
                    {rec.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expected Impact */}
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-medium">Impact attendu:</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{rec.expectedImpact}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
