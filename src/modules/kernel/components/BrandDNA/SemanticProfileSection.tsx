import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SemanticProfile } from "@/modules/shared/types";
import { AIEstimationBadge, AIEstimationAlert } from "./AIEstimationBadge";

interface SemanticProfileSectionProps {
  semanticProfile: SemanticProfile;
}

export function SemanticProfileSection({ semanticProfile }: SemanticProfileSectionProps) {
  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.6) return 'text-emerald-600';
    if (sentiment < 0.4) return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <section className="space-y-6">
      {/* Data reliability notice */}
      <AIEstimationAlert 
        reliability="mixed" 
        details="L'analyse est basée sur les vraies légendes et hashtags des posts. L'interprétation des thématiques, émotions et sentiments est faite par l'IA."
      />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Profil Sémantique</h2>
        <AIEstimationBadge reliability="mixed" />
      </div>

      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="topics">Thématiques</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="emotions">Émotions</TabsTrigger>
          <TabsTrigger value="narratives">Récits</TabsTrigger>
        </TabsList>

        {/* Topics */}
        <TabsContent value="topics" className="space-y-4">
          {semanticProfile.topics.map((topic, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{topic.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${getSentimentColor(topic.sentiment)}`}>
                      {topic.sentiment > 0.6 ? '↑' : topic.sentiment < 0.4 ? '↓' : '→'}
                    </span>
                    <Badge>{Math.round(topic.weight <= 1 ? topic.weight * 100 : topic.weight)}%</Badge>
                  </div>
                </div>
                <Progress value={topic.weight <= 1 ? topic.weight * 100 : topic.weight} className="h-2 mb-3" />
                <div className="flex flex-wrap gap-2">
                  {topic.relatedTerms.map((term, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {term}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Sentiment Distribution */}
        <TabsContent value="sentiment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribution du sentiment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-8 rounded-lg overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${semanticProfile.sentimentDistribution.positive <= 1 ? semanticProfile.sentimentDistribution.positive * 100 : semanticProfile.sentimentDistribution.positive}%` }}
                >
                  {Math.round(semanticProfile.sentimentDistribution.positive <= 1 ? semanticProfile.sentimentDistribution.positive * 100 : semanticProfile.sentimentDistribution.positive)}%
                </div>
                <div 
                  className="bg-gray-400 h-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${semanticProfile.sentimentDistribution.neutral <= 1 ? semanticProfile.sentimentDistribution.neutral * 100 : semanticProfile.sentimentDistribution.neutral}%` }}
                >
                  {Math.round(semanticProfile.sentimentDistribution.neutral <= 1 ? semanticProfile.sentimentDistribution.neutral * 100 : semanticProfile.sentimentDistribution.neutral)}%
                </div>
                <div 
                  className="bg-destructive h-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${semanticProfile.sentimentDistribution.negative <= 1 ? semanticProfile.sentimentDistribution.negative * 100 : semanticProfile.sentimentDistribution.negative}%` }}
                >
                  {Math.round(semanticProfile.sentimentDistribution.negative <= 1 ? semanticProfile.sentimentDistribution.negative * 100 : semanticProfile.sentimentDistribution.negative)}%
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-2xl font-bold text-emerald-600">
                    {Math.round(semanticProfile.sentimentDistribution.positive <= 1 ? semanticProfile.sentimentDistribution.positive * 100 : semanticProfile.sentimentDistribution.positive)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Positif</div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {Math.round(semanticProfile.sentimentDistribution.neutral <= 1 ? semanticProfile.sentimentDistribution.neutral * 100 : semanticProfile.sentimentDistribution.neutral)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Neutre</div>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="text-2xl font-bold text-destructive">
                    {Math.round(semanticProfile.sentimentDistribution.negative <= 1 ? semanticProfile.sentimentDistribution.negative * 100 : semanticProfile.sentimentDistribution.negative)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Négatif</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Phrases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expressions clés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {semanticProfile.keyPhrases.map((phrase, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <span className="font-medium">"{phrase.phrase}"</span>
                      <p className="text-xs text-muted-foreground">{phrase.context}</p>
                    </div>
                    <Badge variant="secondary">{phrase.frequency}x</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emotional Tones */}
        <TabsContent value="emotions" className="space-y-4">
          {semanticProfile.emotionalTones.map((tone, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-lg">{tone.emotion}</h4>
                  <Badge>{Math.round(tone.intensity <= 1 ? tone.intensity * 100 : tone.intensity)}%</Badge>
                </div>
                <Progress value={tone.intensity <= 1 ? tone.intensity * 100 : tone.intensity} className="h-3 mb-4" />
                <div className="flex flex-wrap gap-2">
                  {tone.examples.map((example, i) => (
                    <span key={i} className="text-sm text-muted-foreground italic">
                      "{example}"
                      {i < tone.examples.length - 1 && ' • '}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Narrative Themes */}
        <TabsContent value="narratives" className="space-y-4">
          {semanticProfile.narrativeThemes.map((narrative, index) => (
            <Card key={index} className="overflow-hidden">
              <div 
                className="h-1 bg-primary"
                style={{ width: `${narrative.prevalence <= 1 ? narrative.prevalence * 100 : narrative.prevalence}%` }}
              />
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{narrative.theme}</h4>
                  <Badge variant="outline">{Math.round(narrative.prevalence <= 1 ? narrative.prevalence * 100 : narrative.prevalence)}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{narrative.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </section>
  );
}
