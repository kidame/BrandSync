import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { apifyApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface JobSearch {
  id: string;
  territory_id: string;
  search_keywords: string;
  location: string | null;
  search_url: string;
  status: string;
  scraping_job_id: string | null;
  offers_count: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  analysis_themes: string[] | null;
}

interface JobSearchesListProps {
  territoryId: string;
  refreshTrigger: number;
  selectedSearchId?: string | null;
  onSelectSearchId?: (id: string) => void;
}

export function JobSearchesList({ territoryId, refreshTrigger, selectedSearchId, onSelectSearchId }: JobSearchesListProps) {
  const [searches, setSearches] = useState<JobSearch[]>([]);
  const [qualifiedCountBySearch, setQualifiedCountBySearch] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());

  const fetchSearches = async () => {
    const { data, error } = await supabase
      .from("linkedin_job_searches")
      .select("id, territory_id, search_keywords, location, search_url, status, scraping_job_id, offers_count, error_message, created_at, completed_at, analysis_themes")
      .eq("territory_id", territoryId)
      .order("created_at", { ascending: false });

    if (error) {
      setLoading(false);
      return;
    }
    const list = (data || []) as JobSearch[];
    setSearches(list);

    if (list.length > 0) {
      const searchIds = list.map((s) => s.id);
      const { data: offersData } = await supabase
        .from("linkedin_job_offers")
        .select("id, search_id, analysis_result")
        .in("search_id", searchIds);
      const offers = (offersData || []) as { search_id: string; analysis_result?: { isRelevant?: boolean } | null }[];
      const counts: Record<string, number> = {};
      searchIds.forEach((id) => (counts[id] = 0));
      offers.forEach((o) => {
        if (o.analysis_result?.isRelevant === true) counts[o.search_id] = (counts[o.search_id] ?? 0) + 1;
      });
      setQualifiedCountBySearch(counts);
    } else {
      setQualifiedCountBySearch({});
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSearches();
  }, [territoryId, refreshTrigger]);

  useEffect(() => {
    const running = searches.filter((s) => s.status === "running" && s.scraping_job_id);
    if (running.length === 0) return;
    const interval = setInterval(async () => {
      for (const s of running) {
        if (!s.scraping_job_id) continue;
        const job = (await supabase.from("scraping_jobs").select("config").eq("id", s.scraping_job_id).single()).data;
        const runId = job?.config?.apify_run_id as string | undefined;
        if (!runId) continue;
        const res = await apifyApi.getResults(s.scraping_job_id, runId);
        if (res.success && (res.data?.status === "completed" || res.data?.status === "failed")) {
          setPollingIds((prev) => new Set(prev).add(s.id));
          await fetchSearches();
        }
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [searches.filter((s) => s.status === "running").length, territoryId]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (searches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Recherches LinkedIn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aucune recherche. Lancez une recherche depuis le formulaire.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Recherches LinkedIn
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchSearches}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {searches.map((s) => {
            const themes = Array.isArray(s.analysis_themes) ? s.analysis_themes : [];
            const qualifiedCount = qualifiedCountBySearch[s.id] ?? 0;
            const isSelected = selectedSearchId === s.id;
            return (
              <li
                key={s.id}
                className={`flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted/50"
                }`}
                onClick={() => onSelectSearchId?.(s.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {statusIcon(s.status)}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.search_keywords}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.location && `${s.location} · `}
                        {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.status === "completed" && (
                      <>
                        {qualifiedCount > 0 && (
                          <Badge variant="default" className="bg-emerald-600">{qualifiedCount} pertinentes</Badge>
                        )}
                        <Badge variant="secondary">{s.offers_count} offres</Badge>
                      </>
                    )}
                    <Badge variant={s.status === "completed" ? "default" : s.status === "failed" ? "destructive" : "outline"}>
                      {s.status === "running" ? "En cours" : s.status === "completed" ? "Terminé" : s.status === "failed" ? "Échec" : "En attente"}
                    </Badge>
                  </div>
                </div>
                {themes.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-7">
                    {themes.slice(0, 4).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs font-normal">
                        {t}
                      </Badge>
                    ))}
                    {themes.length > 4 && (
                      <Badge variant="outline" className="text-xs font-normal">+{themes.length - 4}</Badge>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
