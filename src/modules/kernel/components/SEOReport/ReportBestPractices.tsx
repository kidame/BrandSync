import { Shield, CheckCircle2, XCircle, Lock, AlertTriangle, Code, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SEOReportBestPractices } from "../../types/seoReport";

interface ReportBestPracticesProps {
  bestPractices: SEOReportBestPractices;
  bestPracticesScore: number;
}

export function ReportBestPractices({ bestPractices, bestPracticesScore }: ReportBestPracticesProps) {
  const items = [
    {
      key: 'https',
      icon: Lock,
      ...bestPractices.https,
      importance: 'Critique pour la sécurité et le SEO',
    },
    {
      key: 'consoleErrors',
      icon: AlertTriangle,
      ...bestPractices.consoleErrors,
      importance: 'Les erreurs peuvent affecter l\'expérience utilisateur',
    },
    {
      key: 'deprecatedApis',
      icon: Code,
      ...bestPractices.deprecatedApis,
      importance: 'Utilisez des APIs modernes pour la compatibilité',
    },
    {
      key: 'imageAspectRatio',
      icon: Image,
      ...bestPractices.imageAspectRatio,
      importance: 'Évite les décalages de mise en page (CLS)',
    },
  ];

  const passedCount = items.filter(i => i.passed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Bonnes Pratiques
        </h2>
        <Badge variant={bestPracticesScore >= 90 ? "default" : bestPracticesScore >= 50 ? "secondary" : "destructive"}>
          Score: {bestPracticesScore}/100
        </Badge>
      </div>

      {/* Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500">{passedCount}</div>
              <div className="text-sm text-muted-foreground">Réussis</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500">{items.length - passedCount}</div>
              <div className="text-sm text-muted-foreground">Échoués</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold">{items.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card 
            key={item.key}
            className={item.passed 
              ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' 
              : 'border-red-200 bg-red-50/50 dark:bg-red-950/20'
            }
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </div>
                {item.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {item.importance}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
