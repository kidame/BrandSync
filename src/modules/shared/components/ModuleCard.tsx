import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'active' | 'coming-soon' | 'beta';
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ModuleCard({ 
  title, 
  description, 
  icon: Icon, 
  status, 
  children, 
  className,
  onClick 
}: ModuleCardProps) {
  const statusColors = {
    'active': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'coming-soon': 'bg-muted text-muted-foreground border-muted',
    'beta': 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  };

  const statusLabels = {
    'active': 'Actif',
    'coming-soon': 'Bientôt',
    'beta': 'Beta'
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        status === 'active' && "hover:shadow-lg hover:border-primary/30 cursor-pointer",
        status === 'coming-soon' && "opacity-60",
        className
      )}
      onClick={status === 'active' ? onClick : undefined}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="outline" className={cn("text-xs", statusColors[status])}>
            {statusLabels[status]}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-3">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      
      {children && (
        <CardContent className="relative pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
