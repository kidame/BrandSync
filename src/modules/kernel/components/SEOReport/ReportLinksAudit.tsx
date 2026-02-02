import { Link2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LinkWithoutText } from "../../types/seoReport";

interface ReportLinksAuditProps {
  linksWithoutText: LinkWithoutText[];
}

export function ReportLinksAudit({ linksWithoutText }: ReportLinksAuditProps) {
  const hasIssues = linksWithoutText.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Liens sans texte descriptif
          </CardTitle>
          {hasIssues ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {linksWithoutText.length} lien(s)
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
            Tous les liens ont un nom accessible (texte ou aria-label).
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Les liens suivants n'ont pas de texte descriptif. Ajoutez du texte ou un aria-label pour l'accessibilité.
            </p>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Href / Snippet</th>
                  </tr>
                </thead>
                <tbody>
                  {linksWithoutText.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 text-muted-foreground w-8">{i + 1}</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          {item.href && (
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate max-w-full"
                            >
                              {item.href}
                            </a>
                          )}
                          {item.snippet && (
                            <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                              {item.snippet}
                            </code>
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
