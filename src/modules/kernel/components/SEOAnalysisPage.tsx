import { useProjects } from "@/modules/shared/hooks/useProjects";
import { useSEOAnalysis } from "../hooks/useSEOAnalysis";
import { SEOAnalysisForm, SEOAnalysisHistory } from "./SEOAnalysis";
import { SEOReportViewer } from "./SEOReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SEOAnalysisPage() {
  const { selectedProject } = useProjects();
  const {
    analyses,
    selectedAnalysis,
    setSelectedAnalysis,
    isLoading,
    isLoadingHistory,
    analyzeUrl,
    deleteAnalysis,
  } = useSEOAnalysis(selectedProject?.id);

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Analyse SEO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aucun projet sélectionné</AlertTitle>
              <AlertDescription>
                Veuillez sélectionner un projet pour effectuer une analyse SEO.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Form */}
      <SEOAnalysisForm onAnalyze={analyzeUrl} isLoading={isLoading} />

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Analyse en cours...</p>
                <p className="text-sm text-muted-foreground">
                  Cela peut prendre 30 à 60 secondes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results and History Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* History Sidebar */}
          <div className="lg:col-span-1">
            {isLoadingHistory ? (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm text-muted-foreground">Chargement...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <SEOAnalysisHistory
                analyses={analyses}
                onSelect={setSelectedAnalysis}
                onDelete={deleteAnalysis}
                selectedId={selectedAnalysis?.id}
              />
            )}
          </div>

          {/* Main Results Area - Now uses SEOReportViewer */}
          <div className="lg:col-span-3">
            {selectedAnalysis ? (
              <SEOReportViewer 
                analysis={selectedAnalysis} 
                projectName={selectedProject?.name} 
              />
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Aucune analyse disponible</p>
                    <p className="text-sm mt-1">
                      Entrez une URL ci-dessus pour démarrer une analyse SEO
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
