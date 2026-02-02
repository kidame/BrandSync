import { Package, FileCode, Type } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  PageMetrics,
  RenderBlockingResource,
  UnusedResource,
} from "../../types/seoReport";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

interface ReportResourcesAuditProps {
  pageMetrics: PageMetrics;
  renderBlockingResources: RenderBlockingResource[];
  unusedJavascript: UnusedResource[];
  unusedCss: UnusedResource[];
}

export function ReportResourcesAudit({
  pageMetrics,
  renderBlockingResources,
  unusedJavascript,
  unusedCss,
}: ReportResourcesAuditProps) {
  const hasBlocking = renderBlockingResources.length > 0;
  const hasUnusedJs = unusedJavascript.length > 0;
  const hasUnusedCss = unusedCss.length > 0;

  return (
    <div className="space-y-4">
      {/* Métriques globales */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Taille et requêtes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-2xl font-bold text-primary">
                {formatBytes(pageMetrics.totalSizeBytes)}
              </div>
              <div className="text-xs text-muted-foreground">Taille totale</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-2xl font-bold">{pageMetrics.totalRequests}</div>
              <div className="text-xs text-muted-foreground">Requêtes</div>
            </div>
            {pageMetrics.jsSize != null && (
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-lg font-semibold flex items-center gap-1">
                  <FileCode className="h-4 w-4" />
                  {formatBytes(pageMetrics.jsSize)}
                </div>
                <div className="text-xs text-muted-foreground">JavaScript</div>
              </div>
            )}
            {pageMetrics.cssSize != null && (
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-lg font-semibold flex items-center gap-1">
                  <Type className="h-4 w-4" />
                  {formatBytes(pageMetrics.cssSize)}
                </div>
                <div className="text-xs text-muted-foreground">CSS</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ressources bloquantes */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ressources bloquant le rendu</CardTitle>
            {hasBlocking ? (
              <Badge variant="destructive">{renderBlockingResources.length} res.</Badge>
            ) : (
              <Badge variant="secondary">Aucune</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasBlocking ? (
            <p className="text-sm text-muted-foreground">
              Aucune ressource ne bloque le rendu de la page.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {renderBlockingResources.slice(0, 15).map((r, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate max-w-full"
                  >
                    {r.url}
                  </a>
                  {r.totalBytes != null && (
                    <span className="text-muted-foreground">({formatBytes(r.totalBytes)})</span>
                  )}
                  {r.wastedMs != null && (
                    <Badge variant="outline">{r.wastedMs} ms</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* JS inutilisé */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">JavaScript inutilisé</CardTitle>
            {hasUnusedJs ? (
              <Badge variant="secondary">{unusedJavascript.length} fichier(s)</Badge>
            ) : (
              <Badge variant="secondary">Aucun</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasUnusedJs ? (
            <p className="text-sm text-muted-foreground">
              Aucun bundle JS inutilisé détecté (ou non disponible).
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {unusedJavascript.slice(0, 10).map((r, i) => (
                <li key={i}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate block"
                  >
                    {r.url}
                  </a>
                  {r.wastedBytes != null && (
                    <span className="text-muted-foreground text-xs">
                      Économie potentielle : {formatBytes(r.wastedBytes)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* CSS inutilisé */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">CSS inutilisé</CardTitle>
            {hasUnusedCss ? (
              <Badge variant="secondary">{unusedCss.length} fichier(s)</Badge>
            ) : (
              <Badge variant="secondary">Aucun</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasUnusedCss ? (
            <p className="text-sm text-muted-foreground">
              Aucun CSS inutilisé détecté (ou non disponible).
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {unusedCss.slice(0, 10).map((r, i) => (
                <li key={i}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate block"
                  >
                    {r.url}
                  </a>
                  {r.wastedBytes != null && (
                    <span className="text-muted-foreground text-xs">
                      Économie potentielle : {formatBytes(r.wastedBytes)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
