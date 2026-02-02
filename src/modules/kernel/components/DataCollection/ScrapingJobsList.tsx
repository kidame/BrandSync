import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Instagram,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Dna
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrapedPostsPreview } from "./ScrapedPostsPreview";
import { apifyApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ScrapingJob {
  id: string;
  territory_id: string;
  source: string;
  status: "pending" | "running" | "completed" | "failed";
  config: {
    actor_id?: string;
    apify_run_id?: string;
    input?: Record<string, unknown>;
  };
  result_summary: {
    total_items?: number;
    sample?: unknown[];
  } | null;
  posts_count: number;
  images_count: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface ScrapingJobsListProps {
  territoryId: string;
  refreshTrigger: number;
}

export function ScrapingJobsList({ territoryId, refreshTrigger }: ScrapingJobsListProps) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set());
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [generatingDNA, setGeneratingDNA] = useState<string | null>(null);

  const toggleJobExpanded = (jobId: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("scraping_jobs")
      .select("*")
      .eq("territory_id", territoryId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setJobs(data as ScrapingJob[]);
      
      // Check for running jobs that need polling
      const runningJobIds = data
        .filter((job) => job.status === "running")
        .map((job) => job.id);
      setPollingJobs(new Set(runningJobIds));
    }
    setLoading(false);
  };

  const generateBrandDNA = async (jobId: string) => {
    setGeneratingDNA(jobId);
    
    try {
      toast.info("Génération du Brand DNA en cours...", {
        description: "L'analyse AI peut prendre quelques secondes"
      });

      const { data, error } = await supabase.functions.invoke('generate-brand-dna', {
        body: { territory_id: territoryId, job_id: jobId }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur inconnue');
      }

      toast.success("Brand DNA généré avec succès!", {
        description: data.summary?.headline || "Rapport prêt à consulter",
        action: {
          label: "Voir le rapport",
          onClick: () => navigate('/kernel/dna')
        }
      });

    } catch (error) {
      console.error("Error generating Brand DNA:", error);
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      
      if (message.includes("Rate limit")) {
        toast.error("Limite de requêtes atteinte", {
          description: "Veuillez réessayer dans quelques minutes"
        });
      } else if (message.includes("credits")) {
        toast.error("Crédits AI insuffisants", {
          description: "Ajoutez des crédits à votre workspace"
        });
      } else {
        toast.error("Erreur de génération", {
          description: message
        });
      }
    } finally {
      setGeneratingDNA(null);
    }
  };

  // Poll for running jobs
  useEffect(() => {
    if (pollingJobs.size === 0) return;

    const pollInterval = setInterval(async () => {
      for (const jobId of pollingJobs) {
        const job = jobs.find((j) => j.id === jobId);
        if (!job?.config?.apify_run_id) continue;

        try {
          const result = await apifyApi.getResults(jobId, job.config.apify_run_id);
          if (result.data?.status !== "running") {
            // Job completed or failed, refresh the list
            await fetchJobs();
          }
        } catch (error) {
          console.error("Error polling job:", error);
        }
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [pollingJobs, jobs]);

  useEffect(() => {
    fetchJobs();
  }, [territoryId, refreshTrigger]);

  const getStatusIcon = (status: ScrapingJob["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: ScrapingJob["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">En attente</Badge>;
      case "running":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">En cours</Badge>;
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Terminé</Badge>;
      case "failed":
        return <Badge variant="destructive">Échoué</Badge>;
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.toLowerCase().includes("instagram")) {
      return <Instagram className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatSource = (source: string, config: ScrapingJob["config"]) => {
    // Handle profile scraping
    if (source === 'instagram_profile') {
      const usernames = config?.input?.usernames as string[] | undefined;
      if (!usernames) return null;
      return usernames.map((u) => `@${u}`).join(", ");
    }
    
    // Handle hashtag scraping
    const hashtags = config?.input?.hashtags as string[] | undefined;
    if (!hashtags) return null;
    return hashtags.map((h) => `#${h}`).join(", ");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Historique des collectes</CardTitle>
          <CardDescription>
            {jobs.length} job(s) de scraping
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchJobs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune collecte pour ce territoire</p>
            <p className="text-sm">Lancez votre première collecte ci-dessus</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const hasPosts = job.status === "completed" && 
                job.result_summary?.sample && 
                Array.isArray(job.result_summary.sample) && 
                job.result_summary.sample.length > 0;
              const isExpanded = expandedJobs.has(job.id);
              const isGenerating = generatingDNA === job.id;

              return (
                <div
                  key={job.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-muted">
                        {getSourceIcon(job.source)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusIcon(job.status)}
                          <span className="font-medium capitalize">{job.source}</span>
                          {getStatusBadge(job.status)}
                        </div>
                        
                        {formatSource(job.source, job.config) && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {formatSource(job.source, job.config)}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {job.posts_count} posts
                          </span>
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            {job.images_count} images
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(job.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>

                        {job.error_message && (
                          <p className="text-sm text-destructive mt-2">
                            {job.error_message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === "running" && (
                        <div className="w-24">
                          <Progress value={undefined} className="h-2" />
                        </div>
                      )}
                      
                      {hasPosts && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => generateBrandDNA(job.id)}
                            disabled={isGenerating}
                            className="flex items-center gap-1"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-xs">Génération...</span>
                              </>
                            ) : (
                              <>
                                <Dna className="h-4 w-4" />
                                <span className="text-xs hidden sm:inline">Brand DNA</span>
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleJobExpanded(job.id)}
                            className="flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                <span className="text-xs">Masquer</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                <span className="text-xs">Voir les posts</span>
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Scraped posts preview */}
                  {hasPosts && isExpanded && (
                    <ScrapedPostsPreview
                      posts={job.result_summary!.sample as any[]}
                      jobId={job.id}
                      source={job.source}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
