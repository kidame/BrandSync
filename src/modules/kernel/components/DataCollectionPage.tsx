import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  MapPin, 
  Loader2,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  FolderKanban
} from "lucide-react";
import { ScrapingForm, ScrapingJobsList } from "./DataCollection";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/modules/shared/hooks/useProjects";

interface Stats {
  totalJobs: number;
  completedJobs: number;
  totalPosts: number;
  totalImages: number;
}

export function DataCollectionPage() {
  const { selectedProject, loading: projectsLoading } = useProjects();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function loadStats() {
      if (!selectedProject) return;
      
      setLoading(true);
      const { data: jobs } = await supabase
        .from("scraping_jobs")
        .select("status, posts_count, images_count")
        .eq("territory_id", selectedProject.id);

      if (jobs) {
        setStats({
          totalJobs: jobs.length,
          completedJobs: jobs.filter((j) => j.status === "completed").length,
          totalPosts: jobs.reduce((acc, j) => acc + (j.posts_count || 0), 0),
          totalImages: jobs.reduce((acc, j) => acc + (j.images_count || 0), 0),
        });
      } else {
        setStats({ totalJobs: 0, completedJobs: 0, totalPosts: 0, totalImages: 0 });
      }
      setLoading(false);
    }

    loadStats();
  }, [selectedProject, refreshTrigger]);

  const handleJobStarted = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Aucun projet sélectionné</h2>
        <p className="text-muted-foreground">
          Sélectionnez un projet dans la barre latérale ou créez-en un nouveau
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <MapPin className="h-4 w-4" />
          <span>{selectedProject.region}, {selectedProject.country}</span>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Database className="h-6 w-6" />
          Data Collection
        </h1>
        <p className="text-muted-foreground mt-1">
          Collecte et exploration des données sociales pour {selectedProject.name}
        </p>
      </div>

      {/* Stats */}
      {(stats || loading) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Jobs</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalJobs ?? 0}</p>
              <p className="text-xs text-muted-foreground">
                {stats?.completedJobs ?? 0} terminés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Posts</span>
              </div>
              <p className="text-2xl font-bold">{(stats?.totalPosts ?? 0).toLocaleString("fr-CH")}</p>
              <p className="text-xs text-muted-foreground">collectés</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ImageIcon className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Images</span>
              </div>
              <p className="text-2xl font-bold">{(stats?.totalImages ?? 0).toLocaleString("fr-CH")}</p>
              <p className="text-xs text-muted-foreground">récupérées</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Badge variant="outline" className="text-xs">
                  {selectedProject.name}
                </Badge>
              </div>
              <p className="text-2xl font-bold">Actif</p>
              <p className="text-xs text-muted-foreground">projet sélectionné</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <ScrapingForm
            territoryId={selectedProject.id}
            onJobStarted={handleJobStarted}
          />
        </div>

        {/* Jobs List */}
        <div className="lg:col-span-2">
          <ScrapingJobsList
            territoryId={selectedProject.id}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
}
