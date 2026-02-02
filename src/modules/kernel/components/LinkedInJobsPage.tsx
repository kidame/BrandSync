import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  MapPin,
  Loader2,
  Building2,
  FileText,
  Mail,
  FolderKanban,
} from "lucide-react";
import {
  JobSearchesList,
  IntelligentSearchForm,
  QualifiedOffersList,
  EnrichedCompaniesSection,
  CompanyDetailsModal,
  CompaniesProspectingSection,
} from "./LinkedInJobs";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/modules/shared/hooks/useProjects";
import type { EnrichedCompanyRow } from "@/modules/kernel/hooks/useEnrichedCompanies";
import type { LinkedInCompanyRow } from "@/modules/kernel/hooks/useQualifiedOffers";

interface Stats {
  searchesCount: number;
  offersCount: number;
  companiesCount: number;
  prospectingCount: number;
}

export function LinkedInJobsPage() {
  const { selectedProject, loading: projectsLoading } = useProjects();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<EnrichedCompanyRow | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const qualifiedRef = useRef<HTMLDivElement>(null);
  const enrichedRef = useRef<HTMLDivElement>(null);

  const territoryId = selectedProject?.id;

  useEffect(() => {
    async function loadStats() {
      if (!territoryId) return;

      const { data: searches } = await supabase
        .from("linkedin_job_searches")
        .select("id, offers_count")
        .eq("territory_id", territoryId);

      const searchIds = (searches || []).map((s: { id: string }) => s.id);
      const { count: offersCount } =
        searchIds.length > 0
          ? await supabase
              .from("linkedin_job_offers")
              .select("id", { count: "exact", head: true })
              .in("search_id", searchIds)
          : { count: 0 };

      const { data: companyIds } = await supabase
        .from("linkedin_companies")
        .select("id")
        .eq("territory_id", territoryId);
      const ids = (companyIds || []).map((c: { id: string }) => c.id);

      const { count: companiesCount } = await supabase
        .from("linkedin_companies")
        .select("id", { count: "exact", head: true })
        .eq("territory_id", territoryId);

      const { count: prospectingCount } =
        ids.length > 0
          ? await supabase
              .from("linkedin_prospecting")
              .select("id", { count: "exact", head: true })
              .in("company_id", ids)
          : { count: 0 };

      setStats({
        searchesCount: searches?.length ?? 0,
        offersCount: offersCount ?? 0,
        companiesCount: companiesCount ?? 0,
        prospectingCount: prospectingCount ?? 0,
      });
    }

    loadStats();
  }, [territoryId, refreshTrigger]);

  const handleSearchCompleted = (searchId?: string) => {
    setRefreshTrigger((prev) => prev + 1);
    if (searchId) setSelectedSearchId(searchId);
  };

  const handleViewResults = () => {
    qualifiedRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleProposalClick = (company: LinkedInCompanyRow & { company_name?: string }) => {
    setSelectedCompany({
      ...company,
      seo_analysis: null,
    } as EnrichedCompanyRow);
    setDetailsModalOpen(true);
  };

  const handleViewDetails = (company: EnrichedCompanyRow) => {
    setSelectedCompany(company);
    setDetailsModalOpen(true);
  };

  const handleMarkAsSent = async (companyId: string) => {
    await supabase
      .from("linkedin_companies")
      .update({ proposal_status: "sent", updated_at: new Date().toISOString() })
      .eq("id", companyId);
    setRefreshTrigger((prev) => prev + 1);
  };

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Aucun projet sélectionné</h2>
        <p className="text-muted-foreground">
          Sélectionnez un projet dans la barre latérale ou créez-en un nouveau
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <MapPin className="h-4 w-4" />
          <span>{selectedProject.region}, {selectedProject.country}</span>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-[#0A66C2]" />
          Offres LinkedIn & Prospection
        </h1>
        <p className="text-muted-foreground mt-1">
          Recherche intelligente par thèmes, analyse des offres et des entreprises, propositions personnalisées.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Briefcase className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Recherches</span>
              </div>
              <p className="text-2xl font-bold">{stats.searchesCount}</p>
              <p className="text-xs text-muted-foreground">effectuées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Offres</span>
              </div>
              <p className="text-2xl font-bold">{stats.offersCount.toLocaleString("fr-CH")}</p>
              <p className="text-xs text-muted-foreground">récupérées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Building2 className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Entreprises</span>
              </div>
              <p className="text-2xl font-bold">{stats.companiesCount.toLocaleString("fr-CH")}</p>
              <p className="text-xs text-muted-foreground">identifiées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Mail className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Propositions</span>
              </div>
              <p className="text-2xl font-bold">{stats.prospectingCount}</p>
              <p className="text-xs text-muted-foreground">rédigées</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="lg:col-span-1 space-y-6">
          <IntelligentSearchForm
            territoryId={territoryId}
            onSearchCompleted={handleSearchCompleted}
            onViewResults={handleViewResults}
          />
          <JobSearchesList
            territoryId={territoryId}
            refreshTrigger={refreshTrigger}
            selectedSearchId={selectedSearchId}
            onSelectSearchId={setSelectedSearchId}
          />
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-2 space-y-6">
          <div ref={qualifiedRef}>
            <QualifiedOffersList
              territoryId={territoryId}
              searchId={selectedSearchId}
              key={refreshTrigger}
              onProposalClick={handleProposalClick}
            />
          </div>

          <div ref={enrichedRef}>
            <EnrichedCompaniesSection
              territoryId={territoryId}
              searchId={selectedSearchId}
              key={refreshTrigger}
              onViewDetails={handleViewDetails}
              onEditProposal={(company) => {
                setSelectedCompany(company);
                setDetailsModalOpen(true);
              }}
            />
          </div>

          <CompaniesProspectingSection territoryId={territoryId} />
        </div>
      </div>

      <CompanyDetailsModal
        company={selectedCompany}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onEditProposal={(company) => {
          setSelectedCompany(company);
          setDetailsModalOpen(true);
        }}
        onMarkAsSent={handleMarkAsSent}
      />
    </div>
  );
}
