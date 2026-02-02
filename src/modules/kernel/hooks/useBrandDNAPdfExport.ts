import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { 
  BrandDNAReport,
  BrandSummary,
  VisualIdentity,
  SemanticProfile,
  AudienceMatrix,
  Recommendation
} from "@/modules/shared/types";

interface ExportOptions {
  report: BrandDNAReport;
  projectName: string;
  projectRegion: string;
  projectCountry: string;
}

// Brand colors
const COLORS = {
  primary: { r: 99, g: 102, b: 241 }, // Indigo
  secondary: { r: 139, g: 92, b: 246 }, // Purple
  accent: { r: 236, g: 72, b: 153 }, // Pink
  success: { r: 34, g: 197, b: 94 },
  warning: { r: 245, g: 158, b: 11 },
  danger: { r: 239, g: 68, b: 68 },
  dark: { r: 30, g: 30, b: 35 },
  text: { r: 55, g: 55, b: 60 },
  muted: { r: 120, g: 120, b: 130 },
  light: { r: 248, g: 248, b: 252 },
};

export function useBrandDNAPdfExport() {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CH', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CH', { 
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric' 
    }).format(date);
  };

  // Helper to normalize percentage values (handles both 0-1 and 0-100 formats)
  const normalizePercentage = (value: number | undefined | null): number => {
    if (value === undefined || value === null) return 0;
    // If value is <= 1, assume it's 0-1 format and multiply by 100
    // If value is > 1, assume it's already in percentage format
    return value <= 1 ? value * 100 : value;
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 100, g: 100, b: 100 };
  };

  const addCoverPage = (doc: jsPDF, projectName: string, region: string, country: string, generatedAt: Date) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Gradient background effect with rectangles
    doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.rect(0, 0, pageWidth, 100, 'F');
    
    // Secondary accent stripe
    doc.setFillColor(COLORS.secondary.r, COLORS.secondary.g, COLORS.secondary.b);
    doc.rect(0, 85, pageWidth, 25, 'F');
    
    // Decorative circles
    doc.setFillColor(255, 255, 255, 0.1);
    doc.circle(pageWidth - 30, 40, 50, 'F');
    doc.circle(30, 80, 30, 'F');
    
    // Main title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text("Brand DNA", 20, 45);
    
    doc.setFontSize(28);
    doc.setFont("helvetica", "normal");
    doc.text("Report", 20, 58);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255, 0.9);
    doc.text("Analyse stratégique de l'identité de marque", 20, 75);
    
    // Project name box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, 125, pageWidth - 40, 60, 4, 4, 'F');
    
    // Project info
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(projectName, pageWidth / 2, 150, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.setFont("helvetica", "normal");
    doc.text(`${region}, ${country}`, pageWidth / 2, 165, { align: 'center' });
    
    // Report info section
    const infoY = 210;
    doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
    doc.roundedRect(20, infoY, pageWidth - 40, 50, 4, 4, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    doc.setFont("helvetica", "bold");
    doc.text("Date de génération", 35, infoY + 18);
    doc.text("Type d'analyse", pageWidth / 2, infoY + 18, { align: 'center' });
    doc.text("Format", pageWidth - 35, infoY + 18, { align: 'right' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text(formatDate(generatedAt), 35, infoY + 32);
    doc.text("Complète", pageWidth / 2, infoY + 32, { align: 'center' });
    doc.text("Instagram", pageWidth - 35, infoY + 32, { align: 'right' });
    
    // Footer branding
    doc.setFontSize(10);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.text("Propulsé par BrandSync Intelligence", pageWidth / 2, pageHeight - 25, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text("Intelligence artificielle • Analyse sémantique • Vision par ordinateur", pageWidth / 2, pageHeight - 18, { align: 'center' });
  };

  const addPageHeader = (doc: jsPDF, projectName: string, sectionTitle: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header bar
    doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
    doc.rect(0, 0, pageWidth, 22, 'F');
    
    // Project name
    doc.setFontSize(9);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.setFont("helvetica", "normal");
    doc.text(projectName, 20, 14);
    
    // Section title
    doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.setFont("helvetica", "bold");
    doc.text(sectionTitle, pageWidth - 20, 14, { align: 'right' });
    
    return 35; // Y position after header
  };

  const addSectionTitle = (doc: jsPDF, number: string, title: string, subtitle: string, y: number): number => {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Section number badge
    doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.circle(28, y + 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(number, 28, y + 5, { align: 'center' });
    
    // Title
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 42, y + 5);
    
    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 42, y + 13);
    
    // Separator line
    doc.setDrawColor(230, 230, 235);
    doc.setLineWidth(0.5);
    doc.line(20, y + 20, pageWidth - 20, y + 20);
    
    return y + 28;
  };

  const addKPICard = (doc: jsPDF, x: number, y: number, width: number, label: string, value: string, color: { r: number; g: number; b: number }) => {
    // Card background
    doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
    doc.roundedRect(x, y, width, 35, 3, 3, 'F');
    
    // Color accent bar
    doc.setFillColor(color.r, color.g, color.b);
    doc.roundedRect(x, y, 4, 35, 2, 0, 'F');
    
    // Value
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text(value, x + 12, y + 16);
    
    // Label
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.text(label, x + 12, y + 27);
  };

  const drawProgressBar = (doc: jsPDF, x: number, y: number, width: number, percentage: number, color: { r: number; g: number; b: number }) => {
    // Background
    doc.setFillColor(230, 230, 235);
    doc.roundedRect(x, y, width, 6, 3, 3, 'F');
    
    // Progress
    const progressWidth = Math.max(6, (percentage / 100) * width);
    doc.setFillColor(color.r, color.g, color.b);
    doc.roundedRect(x, y, progressWidth, 6, 3, 3, 'F');
  };

  const addSummarySection = (doc: jsPDF, summary: BrandSummary, projectName: string, y: number): number => {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    y = addSectionTitle(doc, "1", "Synthèse Exécutive", "Vue d'ensemble des indicateurs clés", y);
    
    // Headline card
    doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.roundedRect(20, y, pageWidth - 40, 40, 4, 4, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const headlineLines = doc.splitTextToSize(summary.headline || "Analyse Brand DNA", pageWidth - 60);
    doc.text(headlineLines, 30, y + 15);
    
    if (summary.description) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 255, 255, 0.9);
      const descLines = doc.splitTextToSize(summary.description, pageWidth - 60);
      doc.text(descLines.slice(0, 2), 30, y + 28);
    }
    
    y += 50;
    
    // KPI Cards Row
    const cardWidth = (pageWidth - 60) / 4;
    addKPICard(doc, 20, y, cardWidth - 5, "Posts analysés", summary.totalPosts?.toString() || '0', COLORS.primary);
    addKPICard(doc, 20 + cardWidth, y, cardWidth - 5, "Images", summary.totalImages?.toString() || '0', COLORS.secondary);
    addKPICard(doc, 20 + cardWidth * 2, y, cardWidth - 5, "Sentiment", `${normalizePercentage(summary.sentimentScore).toFixed(0)}%`, COLORS.success);
    addKPICard(doc, 20 + cardWidth * 3, y, cardWidth - 5, "Engagement", `${normalizePercentage(summary.engagementRate).toFixed(1)}%`, COLORS.accent);
    
    y += 45;
    
    // Analysis period
    doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
    doc.roundedRect(20, y, pageWidth - 40, 22, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.setFont("helvetica", "normal");
    doc.text("Période d'analyse:", 30, y + 10);
    
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.setFont("helvetica", "bold");
    const startDate = summary.dateRange?.start ? formatShortDate(new Date(summary.dateRange.start)) : 'N/A';
    const endDate = summary.dateRange?.end ? formatShortDate(new Date(summary.dateRange.end)) : 'N/A';
    doc.text(`${startDate}  →  ${endDate}`, 30, y + 17);
    
    y += 32;
    
    // Key insights
    if (summary.keyInsights && summary.keyInsights.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text("💡 Insights Clés", 20, y);
      y += 8;
      
      summary.keyInsights.forEach((insight, index) => {
        doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
        const insightLines = doc.splitTextToSize(insight, pageWidth - 70);
        const boxHeight = insightLines.length * 5 + 8;
        doc.roundedRect(20, y, pageWidth - 40, boxHeight, 2, 2, 'F');
        
        // Bullet
        doc.setFillColor(COLORS.secondary.r, COLORS.secondary.g, COLORS.secondary.b);
        doc.circle(28, y + boxHeight / 2, 2, 'F');
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.text(insightLines, 36, y + 7);
        
        y += boxHeight + 4;
      });
    }
    
    return y + 10;
  };

  const addVisualIdentitySection = (doc: jsPDF, visual: VisualIdentity, projectName: string): number => {
    doc.addPage();
    let y = addPageHeader(doc, projectName, "Identité Visuelle");
    
    y = addSectionTitle(doc, "2", "Identité Visuelle", "Analyse des codes visuels et palettes chromatiques", y);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Color palette section
    if (visual?.dominantColors) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text("🎨 Palette Chromatique", 20, y);
      y += 10;
      
      const allColors = [
        ...(visual.dominantColors.primary || []).map(c => ({ ...c, type: 'Primaire' })),
        ...(visual.dominantColors.secondary || []).map(c => ({ ...c, type: 'Secondaire' })),
        ...(visual.dominantColors.accent || []).map(c => ({ ...c, type: 'Accent' }))
      ].slice(0, 12);
      
      // Color swatches grid
      const swatchSize = 28;
      const gap = 8;
      const cols = 6;
      
      allColors.forEach((color, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = 20 + col * (swatchSize + gap);
        const swatchY = y + row * (swatchSize + 18);
        
        const rgb = hexToRgb(color.hex || '#666666');
        
        // Swatch with shadow effect
        doc.setFillColor(200, 200, 200);
        doc.roundedRect(x + 1, swatchY + 1, swatchSize, swatchSize, 4, 4, 'F');
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.roundedRect(x, swatchY, swatchSize, swatchSize, 4, 4, 'F');
        
        // Hex code
        doc.setFontSize(7);
        doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
        doc.text(color.hex || '', x + swatchSize / 2, swatchY + swatchSize + 6, { align: 'center' });
        
        // Type label
        doc.setFontSize(6);
        doc.text(color.type, x + swatchSize / 2, swatchY + swatchSize + 11, { align: 'center' });
      });
      
      y += Math.ceil(allColors.length / cols) * (swatchSize + 18) + 15;
    }
    
    // Scene categories
    if (visual?.sceneCategories && visual.sceneCategories.length > 0) {
      if (y > 200) {
        doc.addPage();
        y = addPageHeader(doc, projectName, "Identité Visuelle");
      }
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text("📸 Types de Scènes", 20, y);
      y += 8;
      
      visual.sceneCategories.slice(0, 6).forEach((scene, index) => {
        const barY = y + index * 22;
        
        // Label and percentage
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.text(scene.name, 20, barY + 5);
        
        doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
        doc.text(`${scene.count} occurrences`, pageWidth - 20, barY + 5, { align: 'right' });
        
        // Progress bar - use normalizePercentage for confidence
        const confidencePct = normalizePercentage(scene.confidence);
        drawProgressBar(doc, 20, barY + 10, pageWidth - 40, confidencePct, COLORS.primary);
        
        // Percentage label
        doc.setFontSize(8);
        doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
        doc.text(`${confidencePct.toFixed(0)}%`, 20 + (confidencePct / 100) * (pageWidth - 40) + 5, barY + 14);
      });
      
      y += visual.sceneCategories.slice(0, 6).length * 22 + 10;
    }
    
    // Visual themes
    if (visual?.visualThemes && visual.visualThemes.length > 0) {
      if (y > 200) {
        doc.addPage();
        y = addPageHeader(doc, projectName, "Identité Visuelle");
      }
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text("🌈 Thèmes Visuels Dominants", 20, y);
      y += 10;
      
      autoTable(doc, {
        startY: y,
        head: [['Thème', 'Importance', 'Mots-clés associés']],
        body: visual.visualThemes.slice(0, 5).map(theme => [
          theme.name,
          `${normalizePercentage(theme.weight).toFixed(0)}%`,
          theme.keywords?.slice(0, 4).join(' • ') || '-'
        ]),
        theme: 'plain',
        headStyles: { 
          fillColor: [COLORS.primary.r, COLORS.primary.g, COLORS.primary.b],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [COLORS.text.r, COLORS.text.g, COLORS.text.b]
        },
        alternateRowStyles: {
          fillColor: [COLORS.light.r, COLORS.light.g, COLORS.light.b]
        },
        margin: { left: 20, right: 20 },
        tableWidth: 'auto',
      });
      
      y = (doc as any).lastAutoTable.finalY + 10;
    }
    
    return y;
  };

  const addSemanticProfileSection = (doc: jsPDF, semantic: SemanticProfile, projectName: string): number => {
    doc.addPage();
    let y = addPageHeader(doc, projectName, "Profil Sémantique");
    
    y = addSectionTitle(doc, "3", "Profil Sémantique", "Analyse du langage, thématiques et tonalité", y);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Sentiment distribution visual
    if (semantic?.sentimentDistribution) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text("💬 Distribution du Sentiment", 20, y);
      y += 12;
      
      const { positive, neutral, negative } = semantic.sentimentDistribution;
      // Normalize values (handle both 0-1 and 0-100 formats)
      const posNorm = normalizePercentage(positive);
      const neuNorm = normalizePercentage(neutral);
      const negNorm = normalizePercentage(negative);
      const total = posNorm + neuNorm + negNorm;
      const barWidth = pageWidth - 40;
      
      // Stacked bar
      const posWidth = total > 0 ? (posNorm / total) * barWidth : 0;
      const neuWidth = total > 0 ? (neuNorm / total) * barWidth : 0;
      const negWidth = total > 0 ? (negNorm / total) * barWidth : 0;
      
      doc.setFillColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
      doc.roundedRect(20, y, posWidth, 20, 3, 0, 'F');
      
      doc.setFillColor(COLORS.warning.r, COLORS.warning.g, COLORS.warning.b);
      doc.rect(20 + posWidth, y, neuWidth, 20, 'F');
      
      doc.setFillColor(COLORS.danger.r, COLORS.danger.g, COLORS.danger.b);
      doc.roundedRect(20 + posWidth + neuWidth, y, negWidth, 20, 0, 3, 'F');
      
      y += 28;
      
      // Legend
      const legendItems = [
        { label: 'Positif', value: posNorm, color: COLORS.success },
        { label: 'Neutre', value: neuNorm, color: COLORS.warning },
        { label: 'Négatif', value: negNorm, color: COLORS.danger }
      ];
      
      legendItems.forEach((item, index) => {
        const x = 20 + index * 60;
        doc.setFillColor(item.color.r, item.color.g, item.color.b);
        doc.circle(x + 4, y, 4, 'F');
        doc.setFontSize(9);
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.text(`${item.label}: ${item.value.toFixed(0)}%`, x + 12, y + 3);
      });
      
      y += 15;
    }
    
    // Topics
    if (semantic?.topics && semantic.topics.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text("📊 Thématiques Principales", 20, y);
      y += 10;
      
      autoTable(doc, {
        startY: y,
        head: [['Thème', 'Poids', 'Sentiment', 'Termes associés']],
        body: semantic.topics.slice(0, 8).map(topic => [
          topic.name,
          `${normalizePercentage(topic.weight).toFixed(0)}%`,
          topic.sentiment > 0.3 ? '😊 Positif' : topic.sentiment < -0.3 ? '😞 Négatif' : '😐 Neutre',
          topic.relatedTerms?.slice(0, 3).join(', ') || '-'
        ]),
        theme: 'plain',
        headStyles: { 
          fillColor: [COLORS.secondary.r, COLORS.secondary.g, COLORS.secondary.b],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [COLORS.text.r, COLORS.text.g, COLORS.text.b]
        },
        alternateRowStyles: {
          fillColor: [COLORS.light.r, COLORS.light.g, COLORS.light.b]
        },
        margin: { left: 20, right: 20 },
      });
      
      y = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Key phrases
    if (semantic?.keyPhrases && semantic.keyPhrases.length > 0) {
      if (y > 200) {
        doc.addPage();
        y = addPageHeader(doc, projectName, "Profil Sémantique");
      }
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text("🔤 Expressions Clés", 20, y);
      y += 10;
      
      // Word cloud style display
      const phrases = semantic.keyPhrases.slice(0, 10);
      const maxFreq = Math.max(...phrases.map(p => p.frequency));
      
      let currentX = 20;
      let currentY = y;
      const maxWidth = pageWidth - 40;
      
      phrases.forEach((phrase, index) => {
        const fontSize = 8 + (phrase.frequency / maxFreq) * 6;
        doc.setFontSize(fontSize);
        
        // Alternate colors
        const colors = [COLORS.primary, COLORS.secondary, COLORS.accent];
        const color = colors[index % 3];
        doc.setTextColor(color.r, color.g, color.b);
        
        const textWidth = doc.getTextWidth(phrase.phrase) + 10;
        
        if (currentX + textWidth > maxWidth + 20) {
          currentX = 20;
          currentY += 12;
        }
        
        doc.setFillColor(color.r, color.g, color.b, 0.1);
        doc.roundedRect(currentX, currentY - 6, textWidth, 10, 2, 2, 'F');
        doc.text(phrase.phrase, currentX + 5, currentY);
        
        currentX += textWidth + 5;
      });
      
      y = currentY + 20;
    }
    
    // Emotional tones
    if (semantic?.emotionalTones && semantic.emotionalTones.length > 0) {
      if (y > 220) {
        doc.addPage();
        y = addPageHeader(doc, projectName, "Profil Sémantique");
      }
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text("🎭 Tonalités Émotionnelles", 20, y);
      y += 10;
      
      semantic.emotionalTones.slice(0, 5).forEach((tone, index) => {
        const barY = y + index * 18;
        const intensityPct = normalizePercentage(tone.intensity);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.text(tone.emotion, 20, barY + 5);
        
        drawProgressBar(doc, 80, barY, pageWidth - 120, intensityPct, COLORS.accent);
        
        doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
        doc.text(`${intensityPct.toFixed(0)}%`, pageWidth - 25, barY + 5);
      });
      
      y += semantic.emotionalTones.slice(0, 5).length * 18 + 10;
    }
    
    return y;
  };

  const addAudienceSection = (doc: jsPDF, audience: AudienceMatrix, projectName: string): number => {
    doc.addPage();
    let y = addPageHeader(doc, projectName, "Matrice d'Audience");
    
    y = addSectionTitle(doc, "4", "Matrice d'Audience", "Segmentation des communautés et profils types", y);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // AI estimation notice
    doc.setFillColor(255, 250, 235);
    doc.roundedRect(20, y, pageWidth - 40, 20, 3, 3, 'F');
    doc.setDrawColor(COLORS.warning.r, COLORS.warning.g, COLORS.warning.b);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, y, pageWidth - 40, 20, 3, 3, 'S');
    
    doc.setFontSize(9);
    doc.setTextColor(COLORS.warning.r, COLORS.warning.g, COLORS.warning.b);
    doc.text("⚠️ Estimation IA: Ces données sont inférées par l'intelligence artificielle et non issues directement d'Instagram.", 30, y + 12);
    
    y += 30;
    
    if (audience?.tribes && audience.tribes.length > 0) {
      // Tribes overview
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text("👥 Tribus Identifiées", 20, y);
      y += 10;
      
      // Summary table
      autoTable(doc, {
        startY: y,
        head: [['Tribu', 'Part', 'Caractéristiques principales']],
        body: audience.tribes.map(tribe => [
          tribe.name,
          `${normalizePercentage(tribe.percentage).toFixed(0)}%`,
          tribe.characteristics?.slice(0, 3).join(' • ') || '-'
        ]),
        theme: 'plain',
        headStyles: { 
          fillColor: [COLORS.primary.r, COLORS.primary.g, COLORS.primary.b],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [COLORS.text.r, COLORS.text.g, COLORS.text.b]
        },
        alternateRowStyles: {
          fillColor: [COLORS.light.r, COLORS.light.g, COLORS.light.b]
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 20 },
          2: { cellWidth: 'auto' }
        },
        margin: { left: 20, right: 20 },
      });
      
      y = (doc as any).lastAutoTable.finalY + 15;
      
      // Detailed tribe cards
      audience.tribes.forEach((tribe, index) => {
        if (y > 220) {
          doc.addPage();
          y = addPageHeader(doc, projectName, "Matrice d'Audience");
        }
        
        // Tribe card
        doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
        const cardHeight = tribe.description ? 45 : 30;
        doc.roundedRect(20, y, pageWidth - 40, cardHeight, 4, 4, 'F');
        
        // Color bar based on tribe color
        const tribeColor = hexToRgb(tribe.color || '#6366f1');
        doc.setFillColor(tribeColor.r, tribeColor.g, tribeColor.b);
        doc.roundedRect(20, y, 5, cardHeight, 4, 0, 'F');
        
        // Tribe name and percentage
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
        doc.text(tribe.name, 32, y + 12);
        
        doc.setFontSize(14);
        doc.setTextColor(tribeColor.r, tribeColor.g, tribeColor.b);
        doc.text(`${normalizePercentage(tribe.percentage).toFixed(0)}%`, pageWidth - 30, y + 12, { align: 'right' });
        
        // Description
        if (tribe.description) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
          const descLines = doc.splitTextToSize(tribe.description, pageWidth - 80);
          doc.text(descLines.slice(0, 2), 32, y + 24);
        }
        
        // Preferred content tags
        if (tribe.preferredContent && tribe.preferredContent.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
          doc.text(`Contenus préférés: ${tribe.preferredContent.slice(0, 3).join(', ')}`, 32, y + cardHeight - 6);
        }
        
        y += cardHeight + 8;
      });
    }
    
    return y;
  };

  const addRecommendationsSection = (doc: jsPDF, recommendations: Recommendation[], projectName: string): number => {
    doc.addPage();
    let y = addPageHeader(doc, projectName, "Recommandations");
    
    y = addSectionTitle(doc, "5", "Plan d'Action Stratégique", "Recommandations personnalisées et prochaines étapes", y);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    if (recommendations && recommendations.length > 0) {
      const priorityConfig: Record<string, { color: { r: number; g: number; b: number }; label: string; icon: string }> = {
        high: { color: COLORS.danger, label: 'Priorité Haute', icon: '🔴' },
        medium: { color: COLORS.warning, label: 'Priorité Moyenne', icon: '🟡' },
        low: { color: COLORS.success, label: 'Priorité Basse', icon: '🟢' }
      };
      
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const sorted = [...recommendations].sort((a, b) => 
        (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
      );
      
      sorted.forEach((rec, index) => {
        if (y > 230) {
          doc.addPage();
          y = addPageHeader(doc, projectName, "Recommandations");
        }
        
        const config = priorityConfig[rec.priority] || priorityConfig.low;
        
        // Recommendation card
        doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
        const descLines = doc.splitTextToSize(rec.description, pageWidth - 80);
        const actionLines = rec.actionItems?.length || 0;
        const cardHeight = 30 + descLines.length * 5 + actionLines * 8;
        
        doc.roundedRect(20, y, pageWidth - 40, cardHeight, 4, 4, 'F');
        
        // Priority color bar
        doc.setFillColor(config.color.r, config.color.g, config.color.b);
        doc.roundedRect(20, y, 5, cardHeight, 4, 0, 'F');
        
        // Number badge
        doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
        doc.circle(35, y + 10, 6, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}`, 35, y + 13, { align: 'center' });
        
        // Title
        doc.setFontSize(11);
        doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
        doc.text(rec.title, 48, y + 12);
        
        // Priority badge
        doc.setFontSize(8);
        doc.setTextColor(config.color.r, config.color.g, config.color.b);
        doc.text(`${config.icon} ${config.label}`, pageWidth - 30, y + 12, { align: 'right' });
        
        // Category badge
        const categoryLabels: Record<string, string> = {
          content: '📝 Contenu',
          visual: '🎨 Visuel',
          engagement: '💬 Engagement',
          timing: '⏰ Timing',
          audience: '👥 Audience'
        };
        doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
        doc.text(categoryLabels[rec.category] || rec.category, 48, y + 20);
        
        // Description
        let currentY = y + 28;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
        doc.text(descLines, 32, currentY);
        currentY += descLines.length * 5 + 5;
        
        // Action items
        if (rec.actionItems && rec.actionItems.length > 0) {
          doc.setFontSize(8);
          rec.actionItems.forEach((action, i) => {
            doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
            doc.text('→', 36, currentY);
            doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
            const actionText = doc.splitTextToSize(action, pageWidth - 90);
            doc.text(actionText[0], 44, currentY);
            currentY += 7;
          });
        }
        
        y += cardHeight + 8;
      });
    }
    
    return y;
  };

  const addClosingPage = (doc: jsPDF, projectName: string, generatedAt: Date) => {
    doc.addPage();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Gradient footer
    doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.rect(0, pageHeight - 80, pageWidth, 80, 'F');
    
    // Thank you message
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Merci de votre confiance", pageWidth / 2, 80, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    doc.setFont("helvetica", "normal");
    doc.text("Ce rapport a été généré automatiquement par BrandSync Intelligence.", pageWidth / 2, 100, { align: 'center' });
    doc.text("Les analyses sont basées sur les données Instagram collectées.", pageWidth / 2, 112, { align: 'center' });
    
    // Summary box
    doc.setFillColor(COLORS.light.r, COLORS.light.g, COLORS.light.b);
    doc.roundedRect(40, 130, pageWidth - 80, 50, 4, 4, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.text("Projet analysé", 55, 148);
    doc.text("Date de génération", pageWidth - 55, 148, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.setFont("helvetica", "bold");
    doc.text(projectName, 55, 162);
    doc.text(formatDate(generatedAt), pageWidth - 55, 162, { align: 'right' });
    
    // Footer text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("BrandSync Intelligence", pageWidth / 2, pageHeight - 45, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Transformez vos données en stratégie", pageWidth / 2, pageHeight - 32, { align: 'center' });
  };

  const addFooter = (doc: jsPDF, generatedAt: Date) => {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 2; i <= pageCount; i++) { // Skip cover page
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Footer line
      doc.setDrawColor(230, 230, 235);
      doc.setLineWidth(0.3);
      doc.line(20, pageHeight - 18, pageWidth - 20, pageHeight - 18);
      
      doc.setFontSize(8);
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text(
        `BrandSync Intelligence • ${formatDate(generatedAt)}`,
        20,
        pageHeight - 10
      );
      doc.text(
        `Page ${i - 1} / ${pageCount - 1}`,
        pageWidth - 20,
        pageHeight - 10,
        { align: 'right' }
      );
    }
  };

  const exportToPdf = async (options: ExportOptions) => {
    const { report, projectName, projectRegion, projectCountry } = options;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Cover page
    addCoverPage(doc, projectName, projectRegion, projectCountry, report.generatedAt);
    
    // Summary section
    doc.addPage();
    let y = addPageHeader(doc, projectName, "Synthèse");
    y = addSummarySection(doc, report.summary, projectName, y);
    
    // Visual identity section (starts new page internally)
    addVisualIdentitySection(doc, report.visualIdentity, projectName);
    
    // Semantic profile section (starts new page internally)
    addSemanticProfileSection(doc, report.semanticProfile, projectName);
    
    // Audience section (starts new page internally)
    addAudienceSection(doc, report.audienceMatrix, projectName);
    
    // Recommendations section (starts new page internally)
    addRecommendationsSection(doc, report.recommendations, projectName);
    
    // Closing page
    addClosingPage(doc, projectName, report.generatedAt);
    
    // Add footer to all pages
    addFooter(doc, report.generatedAt);
    
    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `BrandDNA_${projectName.replace(/\s+/g, '_')}_${dateStr}.pdf`;
    
    // Save the PDF
    doc.save(filename);
  };

  return { exportToPdf };
}
