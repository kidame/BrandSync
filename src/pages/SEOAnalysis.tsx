import { CommandCenterLayout } from "@/modules/command-center/components";
import { SEOAnalysisPage } from "@/modules/kernel/components/SEOAnalysisPage";

export default function SEOAnalysis() {
  return (
    <CommandCenterLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Analyse SEO</h1>
          <p className="text-muted-foreground">
            Analysez le référencement et les performances de n'importe quel site web
          </p>
        </div>
        <SEOAnalysisPage />
      </div>
    </CommandCenterLayout>
  );
}
