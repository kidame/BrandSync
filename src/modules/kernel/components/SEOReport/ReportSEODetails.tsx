import { CheckCircle2, XCircle, AlertCircle, FileText, Tag, Smartphone, Bot, Link2, Globe2, Code } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SEOReportSEODetails } from "../../types/seoReport";

interface ReportSEODetailsProps {
  seoDetails: SEOReportSEODetails;
  seoScore: number;
}

export function ReportSEODetails({ seoDetails, seoScore }: ReportSEODetailsProps) {
  const StatusIcon = ({ passed }: { passed: boolean }) => {
    if (passed) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const items = [
    {
      icon: FileText,
      label: "Meta Description",
      passed: seoDetails.metaDescription.present,
      content: seoDetails.metaDescription.content,
      length: seoDetails.metaDescription.length,
      recommendation: seoDetails.metaDescription.present
        ? `Longueur: ${seoDetails.metaDescription.length || 0} caractères`
        : "Ajoutez une meta description de 120-160 caractères",
    },
    {
      icon: Tag,
      label: "Titre de page",
      passed: seoDetails.titleTag.present,
      content: seoDetails.titleTag.content,
      length: seoDetails.titleTag.length,
      recommendation: seoDetails.titleTag.present
        ? `Longueur: ${seoDetails.titleTag.length || 0} caractères`
        : "Ajoutez un titre de page de 50-60 caractères",
    },
    {
      icon: Smartphone,
      label: "Viewport (Mobile)",
      passed: seoDetails.viewport,
      recommendation: seoDetails.viewport
        ? "Le site est optimisé pour mobile"
        : "Ajoutez une balise viewport pour le responsive",
    },
    {
      icon: Bot,
      label: "Crawlabilité",
      passed: seoDetails.isCrawlable,
      recommendation: seoDetails.isCrawlable
        ? "Les moteurs de recherche peuvent indexer le site"
        : "Le site bloque l'indexation",
    },
    {
      icon: FileText,
      label: "Robots.txt",
      passed: seoDetails.robotsTxt.present,
      recommendation: seoDetails.robotsTxt.present
        ? "Fichier robots.txt configuré"
        : "Configurez un fichier robots.txt",
    },
    {
      icon: Link2,
      label: "Canonical",
      passed: seoDetails.canonical.present,
      content: seoDetails.canonical.content,
      recommendation: seoDetails.canonical.present
        ? "Balise canonical présente"
        : "Ajoutez une balise canonical pour éviter le contenu dupliqué",
    },
    {
      icon: Globe2,
      label: "Hreflang",
      passed: seoDetails.hreflang.present,
      recommendation: seoDetails.hreflang.present
        ? "Balises hreflang configurées"
        : "Ajoutez des balises hreflang pour le multilingue (si applicable)",
    },
    {
      icon: Code,
      label: "Données structurées",
      passed: seoDetails.structuredData.present,
      recommendation: seoDetails.structuredData.present
        ? "Données structurées détectées (JSON-LD)"
        : "Ajoutez des données structurées pour améliorer les rich snippets",
    },
  ];

  const passedCount = items.filter(i => i.passed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analyse SEO Détaillée</h2>
        <Badge variant={seoScore >= 90 ? "default" : seoScore >= 50 ? "secondary" : "destructive"}>
          Score: {seoScore}/100
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Vérifications techniques</span>
            <span className="text-sm font-normal text-muted-foreground">
              {passedCount}/{items.length} validés
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <item.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.label}</span>
                    <StatusIcon passed={item.passed} />
                  </div>
                  {item.content && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {item.content}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-xs ${item.passed ? 'text-green-600' : 'text-amber-600'}`}>
                      {item.recommendation}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
