import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, Database, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type DataReliability = "real" | "mixed" | "estimated";

interface AIEstimationBadgeProps {
  reliability: DataReliability;
  className?: string;
}

const reliabilityConfig = {
  real: {
    icon: Database,
    label: "Données réelles",
    description: "Basé sur les données collectées depuis Instagram",
    variant: "default" as const,
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    textColor: "text-emerald-700 dark:text-emerald-400",
  },
  mixed: {
    icon: Info,
    label: "Données mixtes",
    description: "Analyse IA basée sur les données réelles (captions, hashtags, engagement)",
    variant: "secondary" as const,
    bgColor: "bg-blue-500/10 border-blue-500/20",
    textColor: "text-blue-700 dark:text-blue-400",
  },
  estimated: {
    icon: Sparkles,
    label: "Estimation IA",
    description: "Données estimées par l'IA - non issues d'Instagram",
    variant: "outline" as const,
    bgColor: "bg-amber-500/10 border-amber-500/20",
    textColor: "text-amber-700 dark:text-amber-400",
  },
};

export function AIEstimationBadge({ reliability, className }: AIEstimationBadgeProps) {
  const config = reliabilityConfig[reliability];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.bgColor, config.textColor, "gap-1", className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

interface AIEstimationAlertProps {
  reliability: DataReliability;
  details?: string;
  className?: string;
}

export function AIEstimationAlert({ reliability, details, className }: AIEstimationAlertProps) {
  const config = reliabilityConfig[reliability];
  const Icon = config.icon;

  if (reliability === "real") {
    return null; // Don't show alert for real data
  }

  return (
    <Alert className={cn(config.bgColor, "border", className)}>
      <Icon className={cn("h-4 w-4", config.textColor)} />
      <AlertDescription className={cn("text-sm", config.textColor)}>
        <span className="font-medium">{config.label}:</span>{" "}
        {details || config.description}
      </AlertDescription>
    </Alert>
  );
}
