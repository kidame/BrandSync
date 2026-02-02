import { Code2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StructuredDataInfo, MetaTagsInfo } from "../../types/seoReport";

interface ReportStructuredDataProps {
  structuredData: StructuredDataInfo;
  metaTags: MetaTagsInfo;
}

export function ReportStructuredData({ structuredData, metaTags }: ReportStructuredDataProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Données structurées (Schema.org)
            </CardTitle>
            {structuredData.hasStructuredData ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Présent
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                Non détecté
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {structuredData.types.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Types détectés :{" "}
                {structuredData.types.map((t, i) => (
                  <Badge key={i} variant="outline" className="ml-1">
                    {t}
                  </Badge>
                ))}
              </p>
              {structuredData.raw != null && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Afficher le JSON brut
                  </summary>
                  <pre className="mt-2 p-3 rounded bg-muted text-xs overflow-auto max-h-64">
                    {JSON.stringify(structuredData.raw, null, 2)}
                  </pre>
                </details>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune donnée structurée (JSON-LD, microdata) détectée. En ajouter peut améliorer
              l'affichage dans les résultats de recherche (rich snippets).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Open Graph & Réseaux sociaux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {metaTags.hasOpenGraph && (
              <Badge variant="default">Open Graph</Badge>
            )}
            {metaTags.hasTwitterCards && (
              <Badge variant="default">Twitter Cards</Badge>
            )}
            {!metaTags.hasOpenGraph && !metaTags.hasTwitterCards && (
              <span className="text-sm text-muted-foreground">Non configuré</span>
            )}
          </div>
          {metaTags.ogTitle && (
            <div>
              <span className="text-xs text-muted-foreground">og:title</span>
              <p className="text-sm font-medium">{metaTags.ogTitle}</p>
            </div>
          )}
          {metaTags.ogDescription && (
            <div>
              <span className="text-xs text-muted-foreground">og:description</span>
              <p className="text-sm">{metaTags.ogDescription}</p>
            </div>
          )}
          {metaTags.ogImage && (
            <div>
              <span className="text-xs text-muted-foreground">og:image</span>
              <a
                href={metaTags.ogImage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block truncate"
              >
                {metaTags.ogImage}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
