import { jsPDF } from "jspdf";
import type { SEOAnalysis } from "../components/SEOAnalysis/SEOAnalysisResults";

const COLORS = {
  primary: { r: 99, g: 102, b: 241 },
  success: { r: 34, g: 197, b: 94 },
  warning: { r: 245, g: 158, b: 11 },
  danger: { r: 239, g: 68, b: 68 },
  dark: { r: 30, g: 30, b: 35 },
  text: { r: 55, g: 55, b: 60 },
  muted: { r: 100, g: 100, b: 110 },
  light: { r: 245, g: 245, b: 250 },
  white: { r: 255, g: 255, b: 255 },
};

export function useSEOPdfExport() {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-CH", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return COLORS.success;
    if (score >= 50) return COLORS.warning;
    return COLORS.danger;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 50) return "À améliorer";
    return "Critique";
  };

  const exportToPdf = (analysis: SEOAnalysis, projectName?: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // === HEADER ===
    doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Rapport d'Analyse SEO", margin, 25);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const urlDisplay = analysis.website_url.length > 50 
      ? analysis.website_url.substring(0, 47) + "..." 
      : analysis.website_url;
    doc.text(urlDisplay, margin, 38);

    if (projectName) {
      doc.setFontSize(10);
      doc.text(`Projet: ${projectName}`, pageWidth - margin, 25, { align: "right" });
    }
    doc.setFontSize(9);
    doc.text(formatDate(new Date(analysis.analyzed_at)), pageWidth - margin, 38, { align: "right" });

    let y = 65;

    // === SCORE GLOBAL ===
    const globalScore = Math.round(
      ((analysis.seo_score ?? 0) +
        (analysis.performance_score ?? 0) +
        (analysis.accessibility_score ?? 0) +
        (analysis.best_practices_score ?? 0)) / 4
    );
    const globalColor = getScoreColor(globalScore);

    doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
    doc.roundedRect(margin, y, contentWidth, 50, 5, 5, "F");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text("Score Global", margin + 15, y + 20);

    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(globalColor.r, globalColor.g, globalColor.b);
    doc.text(`${globalScore}`, margin + 15, y + 42);

    doc.setFontSize(14);
    doc.text("/100", margin + 50, y + 42);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(getScoreLabel(globalScore), margin + 80, y + 38);

    y += 65;

    // === SCORES DÉTAILLÉS ===
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text("Scores Detailles", margin, y);
    y += 12;

    const scores = [
      { label: "SEO", score: analysis.seo_score ?? 0 },
      { label: "Performance", score: analysis.performance_score ?? 0 },
      { label: "Accessibilite", score: analysis.accessibility_score ?? 0 },
      { label: "Bonnes Pratiques", score: analysis.best_practices_score ?? 0 },
    ];

    const cardWidth = (contentWidth - 15) / 4;
    const cardHeight = 45;

    scores.forEach((item, index) => {
      const x = margin + index * (cardWidth + 5);
      const color = getScoreColor(item.score);

      // Card background
      doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, "F");

      // Left color bar
      doc.setFillColor(color.r, color.g, color.b);
      doc.rect(x, y, 4, cardHeight, "F");

      // Score
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(color.r, color.g, color.b);
      doc.text(`${item.score}`, x + 12, y + 22);

      // Label
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text(item.label, x + 12, y + 35);
    });

    y += cardHeight + 20;

    // === VÉRIFICATIONS TECHNIQUES ===
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text("Verifications Techniques", margin, y);
    y += 10;

    const checkItems = [
      {
        label: "Meta description presente",
        passed: analysis.has_meta_description ?? false,
        description: analysis.has_meta_description
          ? "La page a une meta description"
          : "Ajoutez une meta description pour ameliorer le SEO",
      },
      {
        label: "Titre de page present",
        passed: Boolean(analysis.title_tag),
        description: analysis.title_tag 
          ? `Titre: ${analysis.title_tag.substring(0, 50)}${analysis.title_tag.length > 50 ? '...' : ''}`
          : "Aucun titre de page detecte",
      },
      {
        label: "Viewport configure",
        passed: analysis.has_viewport ?? false,
        description: analysis.has_viewport
          ? "Le site est optimise pour mobile"
          : "Ajoutez une balise viewport pour le responsive",
      },
      {
        label: "Site crawlable",
        passed: analysis.is_crawlable ?? false,
        description: analysis.is_crawlable
          ? "Les moteurs de recherche peuvent indexer le site"
          : "Le site bloque l'indexation par les robots",
      },
    ];

    checkItems.forEach((item) => {
      const color = item.passed ? COLORS.success : COLORS.danger;
      const rowHeight = 18;

      // Background
      doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      doc.roundedRect(margin, y, contentWidth, rowHeight, 2, 2, "F");

      // Status indicator
      doc.setFillColor(color.r, color.g, color.b);
      doc.circle(margin + 10, y + rowHeight / 2, 4, "F");

      // Status text
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(item.passed ? "OK" : "X", margin + 10, y + rowHeight / 2 + 1.5, { align: "center" });

      // Label
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text(item.label, margin + 22, y + 8);

      // Description
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text(item.description, margin + 22, y + 15);

      y += rowHeight + 4;
    });

    y += 10;

    // === LÉGENDE ===
    doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
    doc.roundedRect(margin, y, contentWidth, 20, 3, 3, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text("Legende:", margin + 10, y + 13);

    // Excellent
    doc.setFillColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
    doc.circle(margin + 55, y + 10, 4, "F");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    doc.text("90-100", margin + 62, y + 13);

    // À améliorer
    doc.setFillColor(COLORS.warning.r, COLORS.warning.g, COLORS.warning.b);
    doc.circle(margin + 95, y + 10, 4, "F");
    doc.text("50-89", margin + 102, y + 13);

    // Critique
    doc.setFillColor(COLORS.danger.r, COLORS.danger.g, COLORS.danger.b);
    doc.circle(margin + 130, y + 10, 4, "F");
    doc.text("0-49", margin + 137, y + 13);

    // === FOOTER ===
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.text(
      "Rapport genere via Google PageSpeed Insights API",
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" }
    );

    doc.text(analysis.website_url, pageWidth / 2, pageHeight - 10, { align: "center" });

    // Save
    const urlSlug = analysis.website_url
      .replace(/^https?:\/\//, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const dateSlug = new Date(analysis.analyzed_at).toISOString().split("T")[0];
    doc.save(`SEO_Report_${urlSlug}_${dateSlug}.pdf`);
  };

  return { exportToPdf };
}
