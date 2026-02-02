import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Instagram, X, Plus, MapPin, Hash, Target, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apifyApi } from "@/lib/api";

interface ScrapingFormProps {
  territoryId: string;
  onJobStarted: () => void;
}

export function ScrapingForm({ territoryId, onJobStarted }: ScrapingFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [resultsLimit, setResultsLimit] = useState(200);
  const [accountUsername, setAccountUsername] = useState("");

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag));
  };

  const addLocation = () => {
    const loc = locationInput.trim();
    if (loc && !locations.includes(loc)) {
      setLocations([...locations, loc]);
      setLocationInput("");
    }
  };

  const removeLocation = (loc: string) => {
    setLocations(locations.filter((l) => l !== loc));
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: "hashtag" | "location") => {
    if (e.key === "Enter") {
      e.preventDefault();
      type === "hashtag" ? addHashtag() : addLocation();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Nouvelle validation : compte OU hashtags
    if (!accountUsername && hashtags.length === 0) {
      toast({
        title: "Erreur",
        description: "Ajoutez au moins un hashtag OU un compte Instagram",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Si un compte est renseigné, on l'utilise en priorité
      if (accountUsername) {
        const cleanUsername = accountUsername.replace('@', '').trim();
        const result = await apifyApi.scrapeInstagramProfiles(
          territoryId,
          [cleanUsername],
          { resultsLimit }
        );

        if (result.success) {
          toast({
            title: "Collecte lancée",
            description: `Scraping du compte @${cleanUsername} démarré (${resultsLimit} posts max)`,
          });
        } else {
          throw new Error(result.error);
        }
      } 
      // Sinon on utilise les hashtags
      else if (hashtags.length > 0) {
        const result = await apifyApi.scrapeInstagramHashtags(territoryId, hashtags, {
          resultsLimit,
        });

        if (result.success) {
          toast({
            title: "Collecte lancée",
            description: `Scraping Instagram démarré pour ${hashtags.length} hashtag(s)`,
          });
        } else {
          throw new Error(result.error);
        }
      }

      // For locations, we'd need a different actor - for now just show info
      if (locations.length > 0) {
        toast({
          title: "Info",
          description: "Le scraping par lieu sera disponible prochainement",
        });
      }

      onJobStarted();
      setAccountUsername("");
      setHashtags([]);
      setLocations([]);
    } catch (error) {
      console.error("Scraping error:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de lancer la collecte",
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 text-white">
            <Instagram className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Nouvelle collecte Instagram</CardTitle>
            <CardDescription>
              Collectez des publications par hashtags ou lieux
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hashtags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Hashtags
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="valdetravers"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "hashtag")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addHashtag}
                disabled={isLoading || !hashtagInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(tag)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Account Username */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Ou scraper un compte Instagram directement
            </Label>
            <Input
              placeholder="lafermeduvan (sans @)"
              value={accountUsername}
              onChange={(e) => setAccountUsername(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour utiliser les hashtags ci-dessus. Si rempli, les hashtags seront ignorés.
            </p>
          </div>

          {/* Locations */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Lieux (bientôt disponible)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Val-de-Travers"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "location")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addLocation}
                disabled={isLoading || !locationInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {locations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {locations.map((loc) => (
                  <Badge key={loc} variant="secondary" className="pl-2 pr-1 py-1">
                    📍 {loc}
                    <button
                      type="button"
                      onClick={() => removeLocation(loc)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Results limit */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Nombre de résultats
            </Label>
            <Input
              type="number"
              min={10}
              max={100000}
              value={resultsLimit}
              onChange={(e) => setResultsLimit(Number(e.target.value))}
              onBlur={() => {
                // Ensure value is clamped on blur between 10 and 100000
                const clampedValue = Math.min(100000, Math.max(10, resultsLimit));
                if (clampedValue !== resultsLimit) {
                  setResultsLimit(clampedValue);
                }
              }}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Entre 10 et 100'000 publications par source. ⚠️ Plus = plus cher et plus lent.
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || (!accountUsername && hashtags.length === 0)}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Lancement en cours...
              </>
            ) : (
              "Lancer la collecte"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
