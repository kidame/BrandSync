import { Image, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ImageWithoutAlt } from "../../types/seoReport";

interface ReportImagesAuditProps {
  imagesWithoutAlt: ImageWithoutAlt[];
}

export function ReportImagesAudit({ imagesWithoutAlt }: ReportImagesAuditProps) {
  const hasIssues = imagesWithoutAlt.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="h-4 w-4" />
            Images sans attribut alt
          </CardTitle>
          {hasIssues ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {imagesWithoutAlt.length} image(s)
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Aucun problème
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasIssues ? (
          <p className="text-sm text-muted-foreground">
            Toutes les images ont un attribut <code className="rounded bg-muted px-1">alt</code> descriptif.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Les images suivantes n'ont pas d'attribut alt. Ajoutez-en pour l'accessibilité et le SEO.
            </p>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Source / Snippet</th>
                  </tr>
                </thead>
                <tbody>
                  {imagesWithoutAlt.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 text-muted-foreground w-8">{i + 1}</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          {item.src && (
                            <a
                              href={item.src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate max-w-full"
                            >
                              {item.src}
                            </a>
                          )}
                          {item.snippet && (
                            <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                              {item.snippet}
                            </code>
                          )}
                          {item.selector && (
                            <span className="text-xs text-muted-foreground">{item.selector}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
