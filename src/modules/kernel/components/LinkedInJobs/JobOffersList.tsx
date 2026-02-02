import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Building2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface JobOffer {
  id: string;
  search_id: string;
  company_id: string | null;
  company_name: string;
  company_linkedin_url: string | null;
  job_title: string;
  job_url: string | null;
  job_location: string | null;
  job_description: string | null;
  created_at: string;
}

interface JobOffersListProps {
  territoryId: string;
  searchId: string | null;
}

export function JobOffersList({ territoryId, searchId }: JobOffersListProps) {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!territoryId) {
      setOffers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    async function load() {
      if (searchId) {
        const { data, error } = await supabase
          .from("linkedin_job_offers")
          .select("*")
          .eq("search_id", searchId)
          .order("created_at", { ascending: false })
          .limit(200);
        if (!error && data) setOffers(data as JobOffer[]);
        else setOffers([]);
      } else {
        const { data: searchIds } = await supabase
          .from("linkedin_job_searches")
          .select("id")
          .eq("territory_id", territoryId);
        const ids = (searchIds || []).map((s: { id: string }) => s.id);
        if (ids.length === 0) {
          setOffers([]);
        } else {
          const { data, error } = await supabase
            .from("linkedin_job_offers")
            .select("*")
            .in("search_id", ids)
            .order("created_at", { ascending: false })
            .limit(200);
          if (!error && data) setOffers(data as JobOffer[]);
          else setOffers([]);
        }
      }
      setLoading(false);
    }
    load();
  }, [territoryId, searchId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8 text-muted-foreground">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Offres récupérées
          {offers.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {offers.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune offre. Lancez une recherche et attendez la fin du scraping.</p>
        ) : (
          <ul className="space-y-3 max-h-[400px] overflow-y-auto">
            {offers.map((o) => (
              <li key={o.id} className="p-3 rounded-lg border bg-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{o.job_title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      {o.company_name}
                    </p>
                    {o.job_location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {o.job_location}
                      </p>
                    )}
                  </div>
                  {o.job_url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={o.job_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
                {o.job_description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{o.job_description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
