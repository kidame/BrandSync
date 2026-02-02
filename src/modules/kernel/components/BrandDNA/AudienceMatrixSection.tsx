import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import type { AudienceMatrix, Tribe } from "@/modules/shared/types";
import { AIEstimationBadge, AIEstimationAlert } from "./AIEstimationBadge";

interface AudienceMatrixSectionProps {
  audienceMatrix: AudienceMatrix;
}

export function AudienceMatrixSection({ audienceMatrix }: AudienceMatrixSectionProps) {
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'like': return Heart;
      case 'comment': return MessageCircle;
      case 'share': return Share2;
      case 'save': return Bookmark;
      default: return Heart;
    }
  };

  const formatHour = (hour: number) => {
    return `${hour}h`;
  };

  return (
    <section className="space-y-6">
      {/* Data reliability notice - CRITICAL WARNING */}
      <AIEstimationAlert 
        reliability="estimated" 
        details="⚠️ ATTENTION: Les tribus, le nombre de personnes, les heures de pointe et les intérêts sont entièrement inventés par l'IA. Pour des données réelles, connectez Instagram Insights (compte Business requis)."
      />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Matrice d'Audience</h2>
        <div className="flex items-center gap-2">
          <AIEstimationBadge reliability="estimated" />
          <span className="text-sm text-muted-foreground">
            {audienceMatrix.totalReach.toLocaleString('fr-CH')} reach estimé
          </span>
        </div>
      </div>

      {/* Tribes Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {audienceMatrix.tribes.map((tribe) => (
          <TribeCard key={tribe.id} tribe={tribe} />
        ))}
      </div>

      {/* Overlap Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Matrice de chevauchement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left"></th>
                  {audienceMatrix.tribes.map((tribe, i) => (
                    <th key={i} className="p-2 text-center">
                      <div 
                        className="w-3 h-3 rounded-full mx-auto"
                        style={{ backgroundColor: tribe.color }}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audienceMatrix.tribes.map((tribe, i) => (
                  <tr key={i}>
                    <td className="p-2 font-medium text-xs truncate max-w-[120px]">
                      {tribe.name}
                    </td>
                    {audienceMatrix.overlapMatrix[i].map((value, j) => (
                      <td key={j} className="p-2 text-center">
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center text-xs font-medium mx-auto"
                          style={{ 
                            backgroundColor: i === j 
                              ? tribe.color 
                              : `rgba(0,0,0,${value * 0.3})`,
                            color: i === j || value > 0.3 ? 'white' : 'inherit'
                          }}
                        >
                          {i === j ? '—' : `${Math.round(value * 100)}%`}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function TribeCard({ tribe }: { tribe: Tribe }) {
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'like': return Heart;
      case 'comment': return MessageCircle;
      case 'share': return Share2;
      case 'save': return Bookmark;
      default: return Heart;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div 
        className="h-2"
        style={{ backgroundColor: tribe.color }}
      />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{tribe.name}</CardTitle>
          <Badge variant="secondary">{Math.round(tribe.percentage <= 1 ? tribe.percentage * 100 : tribe.percentage)}%</Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{tribe.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{tribe.size.toLocaleString('fr-CH')} personnes</span>
        </div>

        {/* Characteristics */}
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-2">Caractéristiques</h5>
          <div className="flex flex-wrap gap-1">
            {tribe.characteristics.slice(0, 3).map((char, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {char}
              </Badge>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Heures de pointe
          </h5>
          <div className="flex gap-1">
            {tribe.engagementPattern.peakHours.slice(0, 4).map((hour, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {hour}h
              </Badge>
            ))}
          </div>
        </div>

        {/* Interaction Types */}
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-2">Types d'interactions</h5>
          <div className="space-y-1">
            {tribe.engagementPattern.interactionTypes.map((interaction, i) => {
              const Icon = getInteractionIcon(interaction.type);
              return (
                <div key={i} className="flex items-center gap-2">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <Progress 
                    value={interaction.percentage <= 1 ? interaction.percentage * 100 : interaction.percentage} 
                    className="h-1.5 flex-1" 
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {Math.round(interaction.percentage <= 1 ? interaction.percentage * 100 : interaction.percentage)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
