import { Heading, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HeadingStructure } from "../../types/seoReport";

interface ReportHeadingStructureProps {
  headingStructure: HeadingStructure;
}

export function ReportHeadingStructure({ headingStructure }: ReportHeadingStructureProps) {
  const hasMultipleH1 = headingStructure.hasMultipleH1;
  const hasH1 = headingStructure.h1.length > 0;
  const hasIssues = hasMultipleH1 || !hasH1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Heading className="h-4 w-4" />
            Structure des titres (H1 / H2 / H3)
          </CardTitle>
          {hasIssues ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              À corriger
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              OK
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasH1 && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            Aucune balise H1 détectée. Une seule H1 par page est recommandée pour le SEO.
          </p>
        )}
        {hasMultipleH1 && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            Plusieurs balises H1 détectées. Idéalement, une seule H1 par page.
          </p>
        )}

        <div className="space-y-3">
          {headingStructure.h1.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">H1</h3>
              <ul className="space-y-1">
                {headingStructure.h1.map((text, i) => (
                  <li key={i} className="text-base font-medium border-l-2 border-primary pl-3">
                    {text || "(vide)"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {headingStructure.h2.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">H2</h3>
              <ul className="space-y-1">
                {headingStructure.h2.map((text, i) => (
                  <li key={i} className="text-sm border-l-2 border-muted-foreground/50 pl-3">
                    {text || "(vide)"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {headingStructure.h3.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">H3</h3>
              <ul className="space-y-1">
                {headingStructure.h3.map((text, i) => (
                  <li key={i} className="text-sm border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground">
                    {text || "(vide)"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {headingStructure.h1.length === 0 &&
          headingStructure.h2.length === 0 &&
          headingStructure.h3.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune structure de titres extraite du rapport (données non disponibles pour cette analyse).
            </p>
          )}
      </CardContent>
    </Card>
  );
}
