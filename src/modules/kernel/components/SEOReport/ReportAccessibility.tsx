import { Eye, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SEOReportAccessibility, AccessibilityItem } from "../../types/seoReport";

interface ReportAccessibilityProps {
  accessibility: SEOReportAccessibility;
  accessibilityScore: number;
}

export function ReportAccessibility({ accessibility, accessibilityScore }: ReportAccessibilityProps) {
  const items: Array<AccessibilityItem & { key: string }> = [
    { key: 'colorContrast', ...accessibility.colorContrast },
    { key: 'formLabels', ...accessibility.formLabels },
    { key: 'imageAlt', ...accessibility.imageAlt },
    { key: 'buttonName', ...accessibility.buttonName },
    { key: 'linkName', ...accessibility.linkName },
    { key: 'ariaAttributes', ...accessibility.ariaAttributes },
  ];

  const passedCount = items.filter(i => i.passed).length;
  const failedCount = items.length - passedCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Eye className="h-6 w-6" />
          Analyse d'Accessibilité
        </h2>
        <Badge variant={accessibilityScore >= 90 ? "default" : accessibilityScore >= 50 ? "secondary" : "destructive"}>
          Score: {accessibilityScore}/100
        </Badge>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{passedCount}</div>
                <div className="text-sm text-green-600 dark:text-green-500">Éléments conformes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-950/30 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">{failedCount}</div>
                <div className="text-sm text-red-600 dark:text-red-500">Éléments non-conformes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vérifications d'accessibilité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div
              key={item.key}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                item.passed 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20' 
                  : 'bg-red-50 border-red-200 dark:bg-red-950/20'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="font-medium">{item.title}</div>
                  {!item.passed && item.failingElements && item.failingElements > 0 && (
                    <div className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="h-3 w-3" />
                      {item.failingElements} élément(s) à corriger
                    </div>
                  )}
                </div>
              </div>
              <Badge variant={item.passed ? "default" : "destructive"}>
                {item.passed ? 'Conforme' : 'Non conforme'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
