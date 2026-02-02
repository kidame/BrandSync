import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  TrendingUp, 
  Users, 
  FileText, 
  Image as ImageIcon,
  ArrowRight,
  Dna,
  Network,
  Sparkles,
  Workflow,
  Activity,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModuleCard } from "@/modules/shared/components";
import { useProjects } from "@/modules/shared/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";

interface BrandDNAReport {
  id: string;
  summary: {
    totalPosts: number;
    totalImages: number;
    sentimentScore: number;
    engagementRate: number;
  };
  audienceMatrix: {
    totalReach: number;
    tribes: Array<{
      id: string;
      name: string;
      size: number;
      percentage: number;
      color: string;
    }>;
  };
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
  }>;
}

interface ProjectStats {
  completedJobs: number;
  totalPosts: number;
  totalImages: number;
}

export function CommandCenterDashboard() {
  const navigate = useNavigate();
  const { selectedProject, projects, loading: projectsLoading } = useProjects();
  const [dnaReport, setDnaReport] = useState<BrandDNAReport | null>(null);
  const [stats, setStats] = useState<ProjectStats>({ completedJobs: 0, totalPosts: 0, totalImages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!selectedProject) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch latest DNA report for selected project
        const { data: reportData } = await supabase
          .from("brand_dna_reports")
          .select("*")
          .eq("territory_id", selectedProject.id)
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (reportData) {
          setDnaReport({
            id: reportData.id,
            summary: reportData.summary as BrandDNAReport["summary"],
            audienceMatrix: reportData.audience_matrix as BrandDNAReport["audienceMatrix"],
            recommendations: reportData.recommendations as BrandDNAReport["recommendations"],
          });
        } else {
          setDnaReport(null);
        }

        // Fetch project stats
        const { data: jobsData } = await supabase
          .from("scraping_jobs")
          .select("status, posts_count, images_count")
          .eq("territory_id", selectedProject.id);

        if (jobsData) {
          const completedJobs = jobsData.filter(j => j.status === "completed").length;
          const totalPosts = jobsData.reduce((acc, j) => acc + (j.posts_count || 0), 0);
          const totalImages = jobsData.reduce((acc, j) => acc + (j.images_count || 0), 0);
          setStats({ completedJobs, totalPosts, totalImages });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedProject]);

  const activeProjects = projects.filter(p => p.status === "active").length;

  if (projectsLoading || loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Tableau de bord unifié de votre intelligence territoriale
          </p>
        </div>
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucun projet sélectionné</h2>
          <p className="text-muted-foreground mb-4">
            Sélectionnez ou créez un projet dans la barre latérale pour commencer.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Command Center</h1>
        <p className="text-muted-foreground mt-1">
          Tableau de bord unifié de votre intelligence territoriale
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Projets</span>
            </div>
            <p className="text-3xl font-bold">{activeProjects}</p>
            <p className="text-xs text-muted-foreground">actif{activeProjects > 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Posts</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalPosts.toLocaleString('fr-CH')}</p>
            <p className="text-xs text-muted-foreground">collectés</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ImageIcon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Images</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalImages.toLocaleString('fr-CH')}</p>
            <p className="text-xs text-muted-foreground">récupérées</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Audience</span>
            </div>
            <p className="text-3xl font-bold">
              {dnaReport ? `${(dnaReport.audienceMatrix.totalReach / 1000).toFixed(1)}k` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">reach total</p>
          </CardContent>
        </Card>
      </div>

      {/* Territory Card */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500" />
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MapPin className="h-4 w-4" />
                <span>{selectedProject.region}, {selectedProject.country}</span>
              </div>
              <CardTitle className="text-xl">{selectedProject.name}</CardTitle>
              <CardDescription className="mt-1">
                {selectedProject.description || "Aucune description"}
              </CardDescription>
            </div>
            <Badge 
              className={
                selectedProject.status === "active" 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : selectedProject.status === "pending"
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : "bg-muted text-muted-foreground"
              }
            >
              {selectedProject.status === "active" ? "Actif" : selectedProject.status === "pending" ? "En attente" : "Archivé"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {dnaReport ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Sentiment</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="font-semibold">{Math.round(dnaReport.summary.sentimentScore * 100)}%</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Engagement</p>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{dnaReport.summary.engagementRate}%</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Tribus</p>
                  <span className="font-semibold">{dnaReport.audienceMatrix.tribes.length}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Recommandations</p>
                  <span className="font-semibold">{dnaReport.recommendations.length}</span>
                </div>
              </div>
              
              <Button onClick={() => navigate('/kernel/dna')} className="w-full sm:w-auto">
                Voir le Brand DNA Report
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                Aucun rapport DNA généré pour ce projet.
              </p>
              <Button onClick={() => navigate('/kernel/data')} variant="outline">
                Lancer une collecte de données
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ModuleCard
            title="Kernel"
            description="Explorer, Decoder, Map et Brand DNA Reports"
            icon={Dna}
            status="active"
            onClick={() => navigate('/kernel/dna')}
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">
                {dnaReport ? "1 rapport actif" : "Aucun rapport"}
              </span>
            </div>
          </ModuleCard>
          
          <ModuleCard
            title="Graph"
            description="Visualisation des clusters sémantiques et relations"
            icon={Network}
            status="coming-soon"
          />
          
          <ModuleCard
            title="Factory"
            description="Génération d'assets visuels et textuels"
            icon={Sparkles}
            status="coming-soon"
          />
          
          <ModuleCard
            title="Engine"
            description="Pipelines automatisés et workflows"
            icon={Workflow}
            status="coming-soon"
          />
        </div>
      </div>

      {/* Recent Activity / Insights Preview */}
      {dnaReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Tribes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Tribus</CardTitle>
              <CardDescription>Segmentation de l'audience de {selectedProject.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dnaReport.audienceMatrix.tribes.slice(0, 3).map((tribe) => (
                <div key={tribe.id} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tribe.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{tribe.name}</p>
                    <p className="text-xs text-muted-foreground">{tribe.size.toLocaleString('fr-CH')} personnes</p>
                  </div>
                  <Progress value={tribe.percentage} className="w-20 h-2" />
                  <span className="text-sm text-muted-foreground w-10 text-right">
                    {Math.round(tribe.percentage)}%
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Priority Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions prioritaires</CardTitle>
              <CardDescription>Recommandations à impact élevé</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dnaReport.recommendations
                .filter(r => r.priority === 'high')
                .slice(0, 3)
                .map((rec) => (
                  <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-1 h-full bg-destructive rounded-full" />
                    <div>
                      <p className="font-medium text-sm">{rec.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
