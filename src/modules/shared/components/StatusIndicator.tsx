import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: 'active' | 'analyzing' | 'pending' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false,
  className 
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  const statusColors = {
    active: 'bg-emerald-500',
    analyzing: 'bg-amber-500 animate-pulse',
    pending: 'bg-muted-foreground',
    error: 'bg-destructive'
  };

  const statusLabels = {
    active: 'Actif',
    analyzing: 'En analyse',
    pending: 'En attente',
    error: 'Erreur'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn(
        "rounded-full",
        sizeClasses[size],
        statusColors[status]
      )} />
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
}
