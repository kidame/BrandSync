/**
 * Formulaire de recherche intelligente LinkedIn : thèmes personnalisables, scraping Apify, puis process-linkedin-offers.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles,
  Briefcase,
  MapPin,
  Link2,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  useIntelligentSearch,
  parseThemes,
} from "@/modules/kernel/hooks/useIntelligentSearch";

const OFFER_COUNTS = [1, 10, 25, 50, 100, 200, 500, 1000] as const;
const DEFAULT_COUNT = 100;

interface IntelligentSearchFormProps {
  territoryId: string;
  /** Appelé à la fin d'une recherche réussie avec l'ID de la recherche (pour auto-sélection) */
  onSearchCompleted?: (searchId?: string) => void;
  /** Callback pour scroll/navigation vers la section offres qualifiées (ex: "Voir les résultats") */
  onViewResults?: () => void;
}

export function IntelligentSearchForm({
  territoryId,
  onSearchCompleted,
  onViewResults,
}: IntelligentSearchFormProps) {
  const { state, error, stats, warning, lastSearchId, launchSearch, cancelSearch, reset } = useIntelligentSearch(territoryId);

  const [themesText, setThemesText] = useState("");
  const [searchTab, setSearchTab] = useState<"keywords" | "url">("keywords");
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [count, setCount] = useState<number>(DEFAULT_COUNT);

  const themes = parseThemes(themesText);
  const isValid =
    themes.length > 0 &&
    (searchTab === "keywords" ? keywords.trim() : customUrl.trim().startsWith("http"));

  useEffect(() => {
    if (state === "success") {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/2717c23e-de71-4651-86af-59af7b5555fc",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"IntelligentSearchForm.tsx:onSuccess",message:"onSearchCompleted",data:{lastSearchId:lastSearchId??null},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H3"})}).catch(()=>{});
      // #endregion
      onSearchCompleted?.(lastSearchId ?? undefined);
    }
  }, [state, lastSearchId, onSearchCompleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    await launchSearch({
      themes,
      searchType: searchTab,
      keywords: searchTab === "keywords" ? keywords : undefined,
      location: searchTab === "keywords" ? location : undefined,
      searchUrl: searchTab === "url" ? customUrl : undefined,
      count,
    });
  };

  const handleReset = () => {
    reset();
    setThemesText("");
    setKeywords("");
    setLocation("");
    setCustomUrl("");
    setCount(DEFAULT_COUNT);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Recherche Intelligente LinkedIn</CardTitle>
              <CardDescription>
                Définissez des thèmes, lancez le scraping puis l&apos;analyse IA et l&apos;enrichissement automatique.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(state === "success" || state === "error") && (
            <Alert variant={state === "error" ? "destructive" : "default"}>
              {state === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
              <AlertTitle>
                {state === "error" ? "Erreur" : "Recherche terminée"}
              </AlertTitle>
              <AlertDescription>
                {state === "error"
                  ? error
                  : stats
                    ? `${stats.relevant_offers} offres pertinentes détectées sur ${stats.analyzed_offers} analysées. ${stats.proposals_generated} propositions générées.`
                    : "Traitement terminé."}
              </AlertDescription>
              {state === "success" && warning && (
                <p className="text-amber-700 dark:text-amber-400 text-sm font-medium mt-2 px-4 pb-2">
                  {warning}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Nouvelle recherche
                </Button>
                {state === "success" && onViewResults && (
                  <Button variant="secondary" size="sm" onClick={onViewResults}>
                    Voir les résultats
                  </Button>
                )}
              </div>
            </Alert>
          )}

          {(state === "scraping" || state === "processing") && (
            <div className="space-y-2">
              <Progress value={state === "scraping" ? 33 : 66} className="h-2" />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {state === "scraping"
                  ? "Récupération des offres en cours… (cela peut prendre 1 à 2 minutes)"
                  : "Analyse intelligente des offres en cours… (cela peut prendre quelques minutes)"}
              </p>
              {state === "processing" && stats && (
                <p className="text-sm font-medium text-foreground">
                  {stats.analyzed_offers} offres analysées · {stats.relevant_offers} pertinentes · {stats.proposals_generated} propositions générées
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelSearch}
                className="mt-2"
              >
                Annuler
              </Button>
            </div>
          )}

          {state === "idle" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="themes">
                    Thématiques à détecter (une par ligne ou séparées par virgules)
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground">
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      L&apos;IA interprétera ces thèmes de manière large. Ex: &quot;SEO&quot; détectera aussi &quot;référencement&quot;, &quot;optimisation web&quot;, etc.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="themes"
                  placeholder="Exemples : SEO, branding, création de contenu, marketing digital, réseaux sociaux"
                  value={themesText}
                  onChange={(e) => setThemesText(e.target.value)}
                  rows={4}
                  className="resize-none"
                  disabled={state !== "idle"}
                />
              </div>

              <div className="space-y-2">
                <Label>Type de recherche</Label>
                <Tabs value={searchTab} onValueChange={(v) => setSearchTab(v as "keywords" | "url")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="keywords">Mots-clés + lieu</TabsTrigger>
                    <TabsTrigger value="url">URL LinkedIn</TabsTrigger>
                  </TabsList>
                  <TabsContent value="keywords" className="space-y-3 pt-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Mots-clés
                      </Label>
                      <Input
                        placeholder="marketing, content manager, communication..."
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        disabled={state !== "idle"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Lieu (optionnel)
                      </Label>
                      <Input
                        placeholder="Suisse, Paris, Lyon, Remote..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={state !== "idle"}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="space-y-3 pt-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        URL de recherche LinkedIn
                      </Label>
                      <Input
                        placeholder="https://www.linkedin.com/jobs/search/?keywords=marketing&location=Suisse"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        disabled={state !== "idle"}
                      />
                      <p className="text-xs text-muted-foreground">
                        Faites d&apos;abord votre recherche sur LinkedIn, puis copiez l&apos;URL ici.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>Nombre d&apos;offres à récupérer</Label>
                <p className="text-xs text-muted-foreground">
                  Vous pouvez choisir 1 à 1000. L&apos;acteur Apify récupère au minimum 100 offres ; seules les N premières choisies sont analysées (ex. 1 = test rapide).
                </p>
                <Select
                  value={String(count)}
                  onValueChange={(v) => setCount(Number(v))}
                  disabled={state !== "idle"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFER_COUNTS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!isValid || state !== "idle"}
              >
                Lancer la recherche intelligente
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
