/**
 * Exemple d'utilisation du hook useAnalyzeJobOffer.
 * À intégrer temporairement dans la page Offres LinkedIn pour valider la syntaxe et tester l'analyse IA.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useAnalyzeJobOffer } from "@/modules/kernel/hooks/useAnalyzeJobOffer";

/** Découpe une chaîne en thèmes (lignes ou virgules), trim, sans vide */
function parseThemes(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AnalyzeJobOfferExample() {
  const [description, setDescription] = useState("");
  const [themesText, setThemesText] = useState("SEO\nbranding\ncréation de contenu");
  const { analyze, loading, error, result, reset } = useAnalyzeJobOffer();

  const handleAnalyze = () => {
    const themes = parseThemes(themesText);
    if (!description.trim()) return;
    if (themes.length === 0) return;
    analyze({ jobDescription: description.trim(), themes });
  };

  const canAnalyze = description.trim().length > 0 && parseThemes(themesText).length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <div>
            <CardTitle>Exemple : analyse IA d&apos;une offre</CardTitle>
            <CardDescription>
              Saisissez une description d&apos;offre et des thèmes (un par ligne ou séparés par des virgules). L&apos;IA interprétera les thèmes largement.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Thèmes à détecter</Label>
          <Textarea
            placeholder="SEO, branding, création de contenu..."
            value={themesText}
            onChange={(e) => setThemesText(e.target.value)}
            rows={2}
            disabled={loading}
            className="resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label>Description de l&apos;offre (extrait LinkedIn)</Label>
          <Textarea
            placeholder="Coller ici la description du poste..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            disabled={loading}
            className="resize-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={loading || !canAnalyze}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              "Analyser l'offre"
            )}
          </Button>
          {(error || result) && (
            <Button variant="outline" onClick={reset} disabled={loading}>
              Réinitialiser
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-3 p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 flex-wrap">
              {result.isRelevant ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Pertinent
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Non pertinent
                </Badge>
              )}
              <Badge variant="outline">Confiance : {result.confidence} %</Badge>
            </div>
            {result.matchedThemes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Thèmes matchés</p>
                <div className="flex flex-wrap gap-1">
                  {result.matchedThemes.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
            {result.detectedConcepts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Concepts détectés</p>
                <p className="text-sm">{result.detectedConcepts.join(", ")}</p>
              </div>
            )}
            {result.reason && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Explication</p>
                <p className="text-sm">{result.reason}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
