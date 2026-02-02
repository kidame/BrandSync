import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Briefcase, MapPin, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apifyApi } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

interface JobSearchFormProps {
  territoryId: string;
  onSearchStarted: () => void;
}

const LINKEDIN_JOBS_BASE = "https://www.linkedin.com/jobs/search/";

export function JobSearchForm({ territoryId, onSearchStarted }: JobSearchFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [count, setCount] = useState(100);

  const buildSearchUrl = () => {
    if (useCustomUrl && customUrl.trim()) {
      return customUrl.trim();
    }
    const params = new URLSearchParams();
    if (keywords.trim()) params.set("keywords", keywords.trim());
    if (location.trim()) params.set("location", location.trim());
    return params.toString() ? `${LINKEDIN_JOBS_BASE}?${params.toString()}` : LINKEDIN_JOBS_BASE;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchUrl = buildSearchUrl();
    if (!searchUrl.startsWith("http")) {
      toast({
        title: "Erreur",
        description: "Indiquez des mots-clés / lieu ou une URL LinkedIn valide",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: searchRecord, error: searchError } = await supabase
        .from("linkedin_job_searches")
        .insert({
          territory_id: territoryId,
          search_keywords: useCustomUrl ? "URL personnalisée" : keywords.trim() || "—",
          location: useCustomUrl ? "" : location.trim() || "",
          search_url: searchUrl,
          status: "pending",
        })
        .select("id")
        .single();

      if (searchError) throw searchError;
      if (!searchRecord?.id) throw new Error("Création de la recherche échouée");

      const result = await apifyApi.scrapeLinkedInJobs(territoryId, searchUrl, {
        linkedinSearchId: searchRecord.id,
        count: Math.max(100, Math.min(1000, count)),
      });

      if (result.success) {
        toast({
          title: "Recherche lancée",
          description: "Le scraping des offres LinkedIn est en cours. Rafraîchissez la liste dans quelques minutes.",
        });
        onSearchStarted();
        setKeywords("");
        setLocation("");
        setCustomUrl("");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("LinkedIn search error:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de lancer la recherche",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2]">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Nouvelle recherche d&apos;offres</CardTitle>
            <CardDescription>
              Domaine (marketing, tourisme, etc.) ou collez une URL de recherche LinkedIn
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomUrl"
              checked={useCustomUrl}
              onChange={(e) => setUseCustomUrl(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="useCustomUrl" className="text-sm">
              Utiliser une URL de recherche LinkedIn (coller le lien après avoir filtré sur linkedin.com/jobs)
            </Label>
          </div>

          {useCustomUrl ? (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                URL de recherche LinkedIn
              </Label>
              <Input
                placeholder="https://www.linkedin.com/jobs/search/?keywords=marketing&location=Suisse"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Mots-clés / domaine
                </Label>
                <Input
                  placeholder="marketing, tourisme, communication..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Lieu (optionnel)
                </Label>
                <Input
                  placeholder="Suisse, Paris, Remote..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Nombre d&apos;offres à récupérer</Label>
            <Input
              type="number"
              min={100}
              max={1000}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Entre 100 et 1000 (plus = plus long et coût Apify)</p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || (useCustomUrl ? !customUrl.trim() : !keywords.trim())}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Lancement en cours...
              </>
            ) : (
              "Lancer la recherche LinkedIn"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
