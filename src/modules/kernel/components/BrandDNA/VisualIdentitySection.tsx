import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { VisualIdentity } from "@/modules/shared/types";
import { AIEstimationBadge, AIEstimationAlert } from "./AIEstimationBadge";

interface VisualIdentitySectionProps {
  visualIdentity: VisualIdentity;
}

export function VisualIdentitySection({ visualIdentity }: VisualIdentitySectionProps) {
  // Safe access to nested data with defaults
  const dominantColors = visualIdentity?.dominantColors || { primary: [], secondary: [], accent: [] };
  const primaryColors = dominantColors.primary || [];
  const secondaryColors = dominantColors.secondary || [];
  const accentColors = dominantColors.accent || [];
  const sceneCategories = visualIdentity?.sceneCategories || [];
  const visualThemes = visualIdentity?.visualThemes || [];
  const moodBoard = visualIdentity?.moodBoard || [];

  const renderColorSwatch = (color: { hex: string; frequency: number }, index: number) => (
    <div key={index} className="flex flex-col items-center gap-2">
      <div 
        className="w-12 h-12 md:w-16 md:h-16 rounded-lg shadow-md border"
        style={{ backgroundColor: color.hex }}
      />
      <span className="text-xs font-mono text-muted-foreground">{color.hex}</span>
      <span className="text-xs text-muted-foreground">{Math.round((color.frequency || 0) * 100)}%</span>
    </div>
  );

  return (
    <section className="space-y-6">
      {/* Data reliability notice */}
      <AIEstimationAlert 
        reliability="estimated" 
        details="L'IA ne peut pas analyser les images réelles. Les couleurs, scènes et thèmes visuels sont estimés à partir des légendes et hashtags, pas des vraies photos."
      />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Identité Visuelle</h2>
        <AIEstimationBadge reliability="estimated" />
      </div>

      <Tabs defaultValue="palette" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="palette">Palette</TabsTrigger>
          <TabsTrigger value="scenes">Scènes</TabsTrigger>
          <TabsTrigger value="themes">Thèmes</TabsTrigger>
          <TabsTrigger value="moodboard">Moodboard</TabsTrigger>
        </TabsList>

        {/* Color Palette */}
        <TabsContent value="palette" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Palette de couleurs dominantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Couleurs primaires</h4>
                <div className="flex gap-4 flex-wrap">
                  {primaryColors.length > 0 ? primaryColors.map((color, i) => renderColorSwatch(color, i)) : (
                    <p className="text-sm text-muted-foreground">Aucune couleur primaire détectée</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Couleurs secondaires</h4>
                <div className="flex gap-4 flex-wrap">
                  {secondaryColors.length > 0 ? secondaryColors.map((color, i) => renderColorSwatch(color, i)) : (
                    <p className="text-sm text-muted-foreground">Aucune couleur secondaire détectée</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Accents</h4>
                <div className="flex gap-4 flex-wrap">
                  {accentColors.length > 0 ? accentColors.map((color, i) => renderColorSwatch(color, i)) : (
                    <p className="text-sm text-muted-foreground">Aucune couleur d'accent détectée</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Full Palette Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aperçu de la palette complète</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-16 rounded-lg overflow-hidden flex">
                {[...primaryColors, ...secondaryColors, ...accentColors].length > 0 ? (
                  [...primaryColors, ...secondaryColors, ...accentColors].map((color, i) => (
                    <div 
                      key={i}
                      className="h-full flex-1 first:rounded-l-lg last:rounded-r-lg"
                      style={{ 
                        backgroundColor: color.hex,
                        flex: color.frequency || 1
                      }}
                    />
                  ))
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                    Palette non disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scene Categories */}
        <TabsContent value="scenes" className="space-y-4">
          {sceneCategories.length > 0 ? sceneCategories.map((scene, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">{scene.name}</h4>
                    <p className="text-sm text-muted-foreground">{scene.count} images détectées</p>
                  </div>
                  <Badge variant="secondary">
                    {Math.round(scene.confidence <= 1 ? scene.confidence * 100 : scene.confidence)}% confiance
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${scene.confidence <= 1 ? scene.confidence * 100 : scene.confidence}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune catégorie de scène détectée
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Visual Themes */}
        <TabsContent value="themes" className="space-y-4">
          {visualThemes.length > 0 ? visualThemes.map((theme, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <h4 className="font-medium">{theme.name}</h4>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  </div>
                  <Badge>{Math.round((theme.weight || 0) <= 1 ? (theme.weight || 0) * 100 : (theme.weight || 0))}%</Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(theme.keywords || []).map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun thème visuel détecté
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Moodboard */}
        <TabsContent value="moodboard">
          {moodBoard.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {moodBoard.map((item, index) => (
              <Card key={index} className="overflow-hidden group">
                <AspectRatio ratio={4/3}>
                  <div className="w-full h-full bg-muted flex items-center justify-center relative">
                    <img 
                      src={item.imageUrl} 
                      alt={item.caption}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div>
                        <p className="text-white text-sm font-medium">{item.caption}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </AspectRatio>
              </Card>
            ))}
          </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Moodboard non disponible
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
