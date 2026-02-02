/**
 * Section des entreprises enrichies : site web + audit SEO ou analyse ou proposition.
 * Affiche une grille de cards avec scores, besoins, proposition et actions.
 */

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Building2,
  ExternalLink,
  BarChart3,
  Target,
  FileText,
  Edit,
  Copy,
  Send,
  Eye,
  AlertCircle,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useEnrichedCompanies,
  type EnrichedCompanyRow,
  type EnrichedCompaniesFilters,
  type ProposalStatusFilter,
  type ScoreRangeFilter,
} from "@/modules/kernel/hooks/useEnrichedCompanies";
import { CompanyDetailsModal } from "./CompanyDetailsModal";
import { useToast } from "@/components/ui/use-toast";

function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score <= 50) return "text-red-600 dark:text-red-400";
  if (score <= 75) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

/** Extrait du message pour aperçu (500 caractères max dans la card) */
function getProposalExcerpt(customProposal: string | null, maxLen = 500): string {
  if (!customProposal) return "";
  const text = customProposal.replace(/\s+/g, " ").trim();
  return text.length <= maxLen ? text : text.slice(0, maxLen) + "…";
}

function getStatusBadge(status: string | null): { label: string; variant: "default" | "secondary" | "outline"; className?: string } {
  switch (status ?? "draft") {
    case "sent":
      return { label: "Envoyée", variant: "default", className: "bg-emerald-600 hover:bg-emerald-600/90" };
    case "responded":
      return { label: "Réponse reçue", variant: "secondary" };
    default:
      return { label: "Brouillon", variant: "outline" };
  }
}

interface EnrichedCompaniesSectionProps {
  territoryId: string;
  searchId?: string | null;
  onEditProposal?: (company: EnrichedCompanyRow) => void;
  onViewDetails?: (company: EnrichedCompanyRow) => void;
}

export function EnrichedCompaniesSection({
  territoryId,
  searchId,
  onEditProposal,
  onViewDetails,
}: EnrichedCompaniesSectionProps) {
  const { companies, loading, error, filters, updateFilters, markAsSent, refresh } = useEnrichedCompanies(
    territoryId,
    searchId
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<EnrichedCompanyRow | null>(null);
  const { toast } = useToast();

  const handleViewDetails = (company: EnrichedCompanyRow) => {
    setSelectedCompany(company);
    setDetailsOpen(true);
    onViewDetails?.(company);
  };

  const handleCopyProposal = (company: EnrichedCompanyRow) => {
    if (!company.custom_proposal) return;
    navigator.clipboard.writeText(company.custom_proposal);
    toast({ title: "Proposition copiée dans le presse-papier." });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
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

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertTitle>Aucune entreprise enrichie</AlertTitle>
            <AlertDescription>
              Aucune entreprise enrichie pour le moment (site web + audit SEO ou analyse ou proposition). Lancez une recherche intelligente et traitez les offres pour enrichir les entreprises.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Entreprises enrichies
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {companies.length} entreprise{companies.length > 1 ? "s" : ""} avec site, audit SEO ou proposition
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh}>
            Actualiser
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex items-center gap-2 min-w-[180px]">
              <Label className="text-xs whitespace-nowrap">Statut proposition</Label>
              <Select
                value={filters.proposalStatus}
                onValueChange={(v) => updateFilters({ proposalStatus: v as ProposalStatusFilter })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyée</SelectItem>
                  <SelectItem value="responded">Réponse reçue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 min-w-[160px]">
              <Label className="text-xs whitespace-nowrap">Score SEO</Label>
              <Select
                value={filters.scoreRange}
                onValueChange={(v) => updateFilters({ scoreRange: v as ScoreRangeFilter })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="0-50">0–50</SelectItem>
                  <SelectItem value="51-75">51–75</SelectItem>
                  <SelectItem value="76-100">76–100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px] flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Rechercher par nom d'entreprise"
                value={filters.searchQuery}
                onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                className="max-w-sm"
              />
            </div>
          </div>

          {/* Grille de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((company) => {
              const seo = company.seo_analysis;
              const score = seo?.seo_score ?? seo?.performance_score ?? null;
              const analysis = company.company_analysis;
              const statusBadge = getStatusBadge(company.proposal_status);

              return (
                <Card key={company.id} className="overflow-hidden flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-base leading-tight">{company.name}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {company.linkedin_url && (
                        <a
                          href={company.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir sur LinkedIn
                        </a>
                      )}
                      {company.website_url && (
                        <a
                          href={company.website_url.startsWith("http") ? company.website_url : `https://${company.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={company.website_url}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          Site web
                        </a>
                      )}
                      {(company.job_offers ?? []).filter((j) => j.job_url).map((job, idx) => (
                        <a
                          key={idx}
                          href={job.job_url!.startsWith("http") ? job.job_url! : `https://${job.job_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          {job.job_title ? `Annonce : ${job.job_title}` : "Voir l'annonce"}
                        </a>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-2 flex-1">
                    {/* Scores et analyse */}
                    {(seo?.performance_score != null || seo?.accessibility_score != null || seo?.best_practices_score != null || seo?.seo_score != null) && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          Score SEO global
                        </p>
                        <p className={`text-2xl font-bold ${getScoreColor(score)}`}>
                          {score ?? "—"}
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {[
                            { label: "Performance", val: seo?.performance_score },
                            { label: "Accessibilité", val: seo?.accessibility_score },
                            { label: "Best practices", val: seo?.best_practices_score },
                            { label: "SEO", val: seo?.seo_score },
                          ].map(({ label, val }) => (
                            <div key={label} className="flex items-center gap-1">
                              <span className="text-muted-foreground w-20 shrink-0">{label}</span>
                              <Progress value={val ?? 0} className="h-1.5 flex-1" />
                              <span className="w-6 text-right">{val ?? "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis && (
                      <div className="space-y-1.5 text-sm">
                        {analysis.sector && <p><span className="font-medium text-muted-foreground">Secteur :</span> {analysis.sector}</p>}
                        {analysis.industry && <p><span className="font-medium text-muted-foreground">Industrie :</span> {analysis.industry}</p>}
                        {analysis.companySize && <p><span className="font-medium text-muted-foreground">Taille :</span> {analysis.companySize}</p>}
                        {analysis.aboutSummary && (
                          <p className="text-muted-foreground mt-1 line-clamp-3">{analysis.aboutSummary}</p>
                        )}
                      </div>
                    )}

                    {/* Besoins identifiés (tous, avec wrap) */}
                    {(analysis?.identifiedNeeds?.length ?? 0) > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Besoins identifiés
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(analysis!.identifiedNeeds ?? []).map((n) => (
                            <Badge key={n} variant="secondary" className="text-xs">
                              {n}
                            </Badge>
                          ))}
                        </div>
                        {analysis?.targetAudience && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            <span className="font-medium">Audience :</span> {analysis.targetAudience}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Proposition commerciale (zone scrollable, texte complet visible) */}
                    {company.custom_proposal ? (
                      <div className="space-y-1.5 border-t pt-2">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Proposition
                        </p>
                        <div className="rounded-md border bg-muted/30 p-2 max-h-32 overflow-y-auto text-sm whitespace-pre-wrap break-words">
                          {getProposalExcerpt(company.custom_proposal)}
                          {company.custom_proposal.length > 500 && "…"}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={statusBadge.variant as "default" | "secondary" | "outline"} className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                          {company.analyzed_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(company.analyzed_at), "d MMM yyyy", { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 border-t pt-2">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Proposition non générée
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {company.proposal_error
                            ? company.proposal_error
                            : "Souvent dû à un timeout : le traitement de la recherche a été interrompu avant d'enregistrer la proposition pour cette entreprise (beaucoup d'offres traitées). Les logs montrent que generate-commercial-proposal réussit ; process-linkedin-offers peut être arrêté par la plateforme. Relancez une recherche plus ciblée ou consultez les logs Edge Functions."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(company)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Voir les détails complets
                    </Button>
                    {onEditProposal && company.custom_proposal && (
                      <Button variant="outline" size="sm" onClick={() => onEditProposal(company)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier la proposition
                      </Button>
                    )}
                    {company.custom_proposal && (
                      <Button variant="outline" size="sm" onClick={() => handleCopyProposal(company)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copier la proposition
                      </Button>
                    )}
                    {(company.proposal_status === "draft" || !company.proposal_status) && company.custom_proposal && (
                      <Button size="sm" onClick={() => markAsSent(company.id)}>
                        <Send className="h-4 w-4 mr-1" />
                        Marquer comme envoyée
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <CompanyDetailsModal
        company={selectedCompany}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEditProposal={onEditProposal}
        onMarkAsSent={markAsSent}
      />
    </>
  );
}
