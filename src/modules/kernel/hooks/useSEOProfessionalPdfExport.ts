import { useState } from "react";
import { jsPDF } from "jspdf";
import type { SEOReport } from "../types/seoReport";

const COLORS = {
  primary: { r: 17, g: 24, b: 39 },      // Dark slate
  accent: { r: 79, g: 70, b: 229 },      // Indigo
  success: { r: 16, g: 185, b: 129 },    // Emerald
  warning: { r: 245, g: 158, b: 11 },    // Amber
  danger: { r: 239, g: 68, b: 68 },      // Red
  text: { r: 55, g: 65, b: 81 },         // Gray 700
  muted: { r: 107, g: 114, b: 128 },     // Gray 500
  light: { r: 249, g: 250, b: 251 },     // Gray 50
  border: { r: 229, g: 231, b: 235 },    // Gray 200
  white: { r: 255, g: 255, b: 255 },
};

export function useSEOProfessionalPdfExport() {
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return COLORS.success;
    if (score >= 70) return COLORS.accent;
    if (score >= 50) return COLORS.warning;
    return COLORS.danger;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Bon";
    if (score >= 50) return "A ameliorer";
    return "Critique";
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
  };

  const exportToPdf = async (report: SEOReport, projectName?: string) => {
    setIsExporting(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 25;
      const contentWidth = pageWidth - margin * 2;

      // ========== PAGE 1: COVER ==========
      
      // Clean white background
      doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Top accent line
      doc.setFillColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
      doc.rect(0, 0, pageWidth, 4, "F");

      let y = 35;

      // Title
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      doc.text("Audit SEO", margin, y);
      
      y += 12;
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text("Rapport d'analyse de performance web", margin, y);

      y += 25;

      // Divider
      doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);

      y += 20;

      // Site info
      doc.setFontSize(10);
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text("SITE ANALYSE", margin, y);
      
      y += 8;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      doc.text(truncateText(report.metadata.url, 55), margin, y);

      y += 15;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text(`Date: ${formatDate(new Date(report.metadata.analyzedAt))}`, margin, y);
      
      if (projectName) {
        doc.text(`Projet: ${projectName}`, margin + 80, y);
      }

      y += 30;

      // Score Global Card
      const globalColor = getScoreColor(report.metadata.overallScore);
      const cardHeight = 60;
      
      // Card background
      doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 4, 4, "F");
      
      // Left accent bar
      doc.setFillColor(globalColor.r, globalColor.g, globalColor.b);
      doc.rect(margin, y, 5, cardHeight, "F");

      // Score
      doc.setFontSize(48);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(globalColor.r, globalColor.g, globalColor.b);
      doc.text(`${report.metadata.overallScore}`, margin + 25, y + 40);

      doc.setFontSize(16);
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text("/100", margin + 58, y + 40);

      // Status label
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      doc.text("Score Global", margin + 90, y + 25);
      
      doc.setFontSize(14);
      doc.setTextColor(globalColor.r, globalColor.g, globalColor.b);
      doc.text(getScoreLabel(report.metadata.overallScore), margin + 90, y + 40);

      y += cardHeight + 25;

      // Four Score Metrics
      const scores = [
        { label: "SEO", score: report.scores.seo },
        { label: "Performance", score: report.scores.performance },
        { label: "Accessibilite", score: report.scores.accessibility },
        { label: "Bonnes Pratiques", score: report.scores.bestPractices },
      ];

      const metricWidth = (contentWidth - 15) / 4;

      scores.forEach((item, index) => {
        const x = margin + index * (metricWidth + 5);
        const color = getScoreColor(item.score);

        // Metric box
        doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
        doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
        doc.roundedRect(x, y, metricWidth, 45, 3, 3, "FD");

        // Score
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(color.r, color.g, color.b);
        doc.text(`${item.score}`, x + metricWidth / 2, y + 22, { align: "center" });

        // Label
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
        doc.text(item.label, x + metricWidth / 2, y + 36, { align: "center" });
      });

      y += 60;

      // Divider
      doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
      doc.line(margin, y, pageWidth - margin, y);

      y += 15;

      // Summary section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      doc.text("Resume", margin, y);

      y += 12;

      // Strengths
      if (report.strengths.length > 0) {
        doc.setFillColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
        doc.circle(margin + 3, y, 2, "F");
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
        doc.text("Points forts", margin + 10, y + 1.5);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.setFontSize(8);
        
        report.strengths.slice(0, 2).forEach((s) => {
          doc.text(`• ${truncateText(s, 70)}`, margin + 10, y);
          y += 5;
        });
      }

      y += 5;

      // Critical Issues
      if (report.criticalIssues.length > 0) {
        doc.setFillColor(COLORS.danger.r, COLORS.danger.g, COLORS.danger.b);
        doc.circle(margin + 3, y, 2, "F");
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.danger.r, COLORS.danger.g, COLORS.danger.b);
        doc.text("Points a ameliorer", margin + 10, y + 1.5);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.setFontSize(8);
        
        report.criticalIssues.slice(0, 2).forEach((issue) => {
          doc.text(`• ${truncateText(issue, 70)}`, margin + 10, y);
          y += 5;
        });
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text("1 / 3", pageWidth / 2, pageHeight - 15, { align: "center" });

      // ========== PAGE 2: METRICS ==========
      doc.addPage();

      // Top accent line
      doc.setFillColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
      doc.rect(0, 0, pageWidth, 4, "F");

      y = 25;

      // Section title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      doc.text("Metriques de Performance", margin, y);

      y += 20;

      // Performance metrics
      const metrics = [
        { label: "First Contentful Paint (FCP)", value: report.performanceMetrics.fcp.displayValue, score: report.performanceMetrics.fcp.score },
        { label: "Largest Contentful Paint (LCP)", value: report.performanceMetrics.lcp.displayValue, score: report.performanceMetrics.lcp.score },
        { label: "Total Blocking Time (TBT)", value: report.performanceMetrics.tbt.displayValue, score: report.performanceMetrics.tbt.score },
        { label: "Cumulative Layout Shift (CLS)", value: report.performanceMetrics.cls.displayValue, score: report.performanceMetrics.cls.score },
        { label: "Speed Index", value: report.performanceMetrics.speedIndex.displayValue, score: report.performanceMetrics.speedIndex.score },
        { label: "Time to Interactive (TTI)", value: report.performanceMetrics.tti.displayValue, score: report.performanceMetrics.tti.score },
      ];

      metrics.forEach((metric, index) => {
        const color = getScoreColor(Math.round(metric.score * 100));
        const rowHeight = 16;
        const isEven = index % 2 === 0;

        if (isEven) {
          doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
          doc.rect(margin, y - 4, contentWidth, rowHeight, "F");
        }

        // Status dot
        doc.setFillColor(color.r, color.g, color.b);
        doc.circle(margin + 5, y + 3, 3, "F");

        // Label
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.text(metric.label, margin + 14, y + 5);

        // Value
        doc.setFont("helvetica", "bold");
        doc.setTextColor(color.r, color.g, color.b);
        doc.text(metric.value, pageWidth - margin, y + 5, { align: "right" });

        y += rowHeight;
      });

      y += 25;

      // SEO Checklist
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      doc.text("Audit SEO", margin, y);

      y += 20;

      const seoChecks = [
        { label: "Meta description", passed: report.seoDetails.metaDescription.present },
        { label: "Titre de page", passed: report.seoDetails.titleTag.present },
        { label: "Viewport mobile", passed: report.seoDetails.viewport },
        { label: "Indexation autorisee", passed: report.seoDetails.isCrawlable },
        { label: "Robots.txt", passed: report.seoDetails.robotsTxt.present },
        { label: "Balise canonical", passed: report.seoDetails.canonical.present },
      ];

      // Two columns
      const colWidth = contentWidth / 2 - 10;
      
      seoChecks.forEach((check, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + col * (colWidth + 20);
        const itemY = y + row * 18;

        const color = check.passed ? COLORS.success : COLORS.danger;

        // Status indicator
        doc.setFillColor(color.r, color.g, color.b);
        doc.circle(x + 4, itemY + 2, 4, "F");

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(check.passed ? "OK" : "X", x + 4, itemY + 3.5, { align: "center" });

        // Label
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.text(check.label, x + 14, itemY + 4);
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text("2 / 3", pageWidth / 2, pageHeight - 15, { align: "center" });

      // ========== PAGE 3: RECOMMENDATIONS ==========
      doc.addPage();

      // Top accent line
      doc.setFillColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
      doc.rect(0, 0, pageWidth, 4, "F");

      y = 25;

      // Section title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      doc.text("Recommandations", margin, y);

      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text("Actions prioritaires pour ameliorer votre score", margin, y);

      y += 18;

      // Table header
      doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      doc.rect(margin, y, contentWidth, 12, "F");
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Probleme", margin + 5, y + 8);
      doc.text("Priorite", margin + 95, y + 8);
      doc.text("Effort", margin + 125, y + 8);
      doc.text("Impact", margin + 150, y + 8);

      y += 12;

      const priorityLabels: Record<string, string> = {
        critical: "Critique",
        high: "Haute",
        medium: "Moyenne",
        low: "Basse",
      };

      const priorityColors: Record<string, typeof COLORS.danger> = {
        critical: COLORS.danger,
        high: COLORS.warning,
        medium: COLORS.accent,
        low: COLORS.success,
      };

      const effortLabels: Record<string, string> = {
        low: "Faible",
        medium: "Moyen",
        high: "Eleve",
      };

      report.recommendations.slice(0, 8).forEach((rec, index) => {
        const rowHeight = 14;
        const isEven = index % 2 === 0;

        if (isEven) {
          doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
        } else {
          doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
        }
        doc.rect(margin, y, contentWidth, rowHeight, "F");

        // Problem (truncated)
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.text(truncateText(rec.problem, 42), margin + 5, y + 9);

        // Priority badge
        const pColor = priorityColors[rec.priority] || COLORS.accent;
        doc.setFillColor(pColor.r, pColor.g, pColor.b);
        doc.roundedRect(margin + 93, y + 3, 25, 8, 2, 2, "F");
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(priorityLabels[rec.priority] || rec.priority, margin + 105.5, y + 8.5, { align: "center" });

        // Effort
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.text(effortLabels[rec.effort] || rec.effort, margin + 125, y + 9);

        // Impact
        doc.setTextColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
        doc.setFont("helvetica", "bold");
        doc.text(`+${Math.min(rec.impact, 20)} pts`, margin + 150, y + 9);

        y += rowHeight;
      });

      y += 20;

      // Legend
      doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
      doc.roundedRect(margin, y, contentWidth, 22, 3, 3, "F");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      doc.text("Legende des scores", margin + 8, y + 10);

      const legendItems = [
        { label: "90+ Excellent", color: COLORS.success },
        { label: "70-89 Bon", color: COLORS.accent },
        { label: "50-69 Moyen", color: COLORS.warning },
        { label: "0-49 Critique", color: COLORS.danger },
      ];

      let legendX = margin + 55;
      legendItems.forEach((item) => {
        doc.setFillColor(item.color.r, item.color.g, item.color.b);
        doc.circle(legendX, y + 8, 3, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.text(item.label, legendX + 6, y + 10);
        legendX += 35;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text("3 / 3", pageWidth / 2, pageHeight - 20, { align: "center" });
      
      doc.setFontSize(7);
      doc.text("Rapport genere via Google PageSpeed Insights", pageWidth / 2, pageHeight - 12, { align: "center" });

      // Save
      const urlSlug = report.metadata.url
        .replace(/^https?:\/\//, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 25);
      const dateSlug = new Date(report.metadata.analyzedAt).toISOString().split("T")[0];
      doc.save(`Audit_SEO_${urlSlug}_${dateSlug}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPdf, isExporting };
}
