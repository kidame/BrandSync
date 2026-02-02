import { Lightbulb, TrendingUp, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SEOOpportunity } from "../../types/seoReport";

interface ReportOpportunitiesProps {
  opportunities: SEOOpportunity[];
}

export function ReportOpportunities({ opportunities }: ReportOpportunitiesProps) {
  const getImpactBadge = (impact: SEOOpportunity['impact']) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-red-500">Impact élevé</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Impact moyen</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">Impact faible</Badge>;
    }
  };

  const getCategoryLabel = (category: SEOOpportunity['category']) => {
    switch (category) {
      case 'seo': return 'SEO';
      case 'performance': return 'Performance';
      case 'accessibility': return 'Accessibilité';
      case 'best-practices': return 'Bonnes Pratiques';
    }
  };

  const categories = ['seo', 'performance', 'accessibility', 'best-practices'] as const;
  
  const opportunitiesByCategory = categories.reduce((acc, cat) => {
    acc[cat] = opportunities.filter(o => o.category === cat);
    return acc;
  }, {} as Record<typeof categories[number], SEOOpportunity[]>);

  const highImpactCount = opportunities.filter(o => o.impact === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="h-6 w-6" />
          Opportunités d'Amélioration
        </h2>
        {highImpactCount > 0 && (
          <Badge variant="destructive">
            {highImpactCount} opportunité(s) à fort impact
          </Badge>
        )}
      </div>

      <Tabs defaultValue="seo">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="relative">
              {getCategoryLabel(cat)}
              {opportunitiesByCategory[cat].length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 px-1.5 rounded-full">
                  {opportunitiesByCategory[cat].length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="space-y-4 mt-4">
            {opportunitiesByCategory[cat].length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune opportunité identifiée dans cette catégorie</p>
                </CardContent>
              </Card>
            ) : (
              opportunitiesByCategory[cat].map((opp) => (
                <Card key={opp.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className={`h-4 w-4 shrink-0 ${
                          opp.impact === 'high' ? 'text-red-500' :
                          opp.impact === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <span className="truncate">{opp.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {opp.savings && (
                          <Badge variant="outline" className="text-green-600">
                            Gain: {opp.savings}
                          </Badge>
                        )}
                        {getImpactBadge(opp.impact)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{opp.description}</p>
                    </div>
                    <div className="mt-2 text-xs">
                      Score actuel: <span className="font-medium">{opp.score}/100</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
