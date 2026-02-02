/**
 * Liste des offres qualifiées (analysis_result.isRelevant = true) avec score, thèmes, statut enrichissement et proposition.
 */

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Building2,
  TrendingUp,
  Tag,
  ExternalLink,
  FileText,
  AlertCircle,
  Inbox,
} from "lucide-react";
import {
  useQualifiedOffers,
  type QualifiedOfferRow,
  type LinkedInCompanyRow,
} from "@/modules/kernel/hooks/useQualifiedOffers";

const THEME_COLORS: Record<string, string> = {
  SEO: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  branding: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  "création de contenu": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "marketing digital": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "réseaux sociaux": "bg-pink-500/15 text-pink-700 dark:text-pink-400",
};

function getThemeBadgeClass(theme: string): string {
  return THEME_COLORS[theme] ?? "bg-muted text-muted-foreground";
}

function getEnrichmentStatus(company: LinkedInCompanyRow | null): { label: string; variant: "default" | "secondary" | "outline"; className?: string } {
  if (!company) return { label: "Site introuvable", variant: "secondary" };
  if (company.seo_audit_id) return { label: "Site analysé", variant: "default", className: "bg-emerald-600 hover:bg-emerald-600/90" };
  if (company.website_url) return { label: "Audit SEO en attente", variant: "outline", className: "border-amber-500 text-amber-700 dark:text-amber-400" };
  return { label: "Site introuvable", variant: "secondary" };
}

interface QualifiedOffersListProps {
  territoryId: string;
  searchId?: string | null;
  onProposalClick?: (company: LinkedInCompanyRow & { company_name?: string }) => void;
  /** ID optionnel pour le scroll depuis "Voir les résultats" */
  id?: string;
}

export function QualifiedOffersList({
  territoryId,
  searchId,
  onProposalClick,
  id,
}: QualifiedOffersListProps) {
  const { offers, loading, error, refresh, loadMore, hasMore } = useQualifiedOffers(territoryId, searchId);

  if (loading) {
    return (
      <Card id={id}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card id={id}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button variant="outline" size="sm" className="mt-2" onClick={refresh}>
              Réessayer
            </Button>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card id={id}>
        <CardContent className="pt-6">
          <Alert>
            <Inbox className="h-4 w-4" />
            <AlertTitle>Aucune offre qualifiée</AlertTitle>
            <AlertDescription>
              Aucune offre avec analyse pertinente (isRelevant) pour le moment. Lancez une recherche intelligente pour analyser les offres.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id={id}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Offres qualifiées
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {offers.length} offre{offers.length > 1 ? "s" : ""} pertinente{offers.length > 1 ? "s" : ""} (analyse IA)
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh}>
          Actualiser
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-4">
          {offers.map((offer) => {
            const company = offer.linkedin_companies;
            const confidence = offer.analysis_result?.confidence ?? 0;
            const matchedThemes = offer.analysis_result?.matchedThemes ?? [];
            const detectedConcepts = offer.analysis_result?.detectedConcepts ?? [];
            const reason = offer.analysis_result?.reason ?? "";
            const status = getEnrichmentStatus(company);
            const hasProposal = !!company?.custom_proposal;

            return (
              <li key={offer.id}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold line-clamp-2 flex items-start gap-1" title={offer.job_title}>
                          <Briefcase className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                          <span className="break-words">{offer.job_title}</span>
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          {company?.linkedin_url ? (
                            <a
                              href={company.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline line-clamp-1 break-all"
                              title={offer.company_name}
                            >
                              {offer.company_name}
                            </a>
                          ) : (
                            <span className="line-clamp-1 break-all" title={offer.company_name}>{offer.company_name}</span>
                          )}
                        </p>
                      </div>
                      <Badge variant={status.variant as "default" | "secondary" | "outline"} className={`flex-shrink-0 ${status.className ?? ""}`}>
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Score de pertinence
                      </p>
                      <Progress value={confidence} className="h-2" />
                      <p className="text-xs text-muted-foreground">{confidence} %</p>
                    </div>
                    {matchedThemes.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Thèmes matchés
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {matchedThemes.map((t) => (
                            <Badge key={t} variant="secondary" className={getThemeBadgeClass(t)}>
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {detectedConcepts.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Concepts détectés</p>
                        <div className="flex flex-wrap gap-1">
                          {detectedConcepts.map((c) => (
                            <Badge key={c} variant="outline" className="text-xs font-normal">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {reason && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Raison de la pertinence</p>
                        <div className="rounded-md border bg-muted/30 p-2 max-h-20 overflow-y-auto text-xs text-muted-foreground">
                          {reason}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 pt-2 border-t">
                    {offer.job_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={offer.job_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Voir l&apos;annonce
                        </a>
                      </Button>
                    )}
                    {hasProposal && company && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onProposalClick?.({ ...company, company_name: offer.company_name })}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Voir la proposition
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={loadMore} className="w-full sm:w-auto">
              Voir plus
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
