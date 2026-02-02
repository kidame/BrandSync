/**
 * Types pour la prospection LinkedIn intelligente.
 * Analyse IA des offres, enrichissement entreprises, propositions commerciales.
 */

// ========== Analyse IA des offres ==========

/** Résultat de l'analyse IA d'une offre (analyzeJobOffer) */
export interface JobOfferAnalysisResult {
  /** L'offre correspond-elle aux thèmes recherchés (interprétés largement) ? */
  isRelevant: boolean;
  /** Thèmes utilisateur qui matchent (ex: "SEO", "branding") */
  matchedThemes: string[];
  /** Niveau de confiance de la pertinence (0 à 100) */
  confidence: number;
  /** Concepts détectés dans l'offre (ex: "référencement naturel", "stratégie de contenu") */
  detectedConcepts: string[];
  /** Explication courte de pourquoi l'offre correspond ou non aux thèmes */
  reason: string;
}

/** Entrée pour l'analyse d'une offre */
export interface AnalyzeJobOfferInput {
  /** Description complète de l'offre (texte LinkedIn) */
  jobDescription: string;
  /** Thèmes définis par l'utilisateur (mots-clés interprétés largement par l'IA) */
  themes: string[];
}

// ========== Analyse entreprise (activité / secteur) ==========

/** Résultat de l'analyse d'activité d'une entreprise (analyzeCompanyActivity) */
export interface CompanyAnalysisResult {
  /** Secteur d'activité détecté */
  sector: string;
  /** Services ou produits identifiés */
  services: string[];
  /** Texte "À propos" ou description résumée */
  aboutSummary: string;
  /** Besoins identifiés (basés sur l'offre et le site) */
  identifiedNeeds: string[];
}

// ========== Proposition commerciale ==========

/** Données pour générer une proposition commerciale */
export interface GenerateProposalInput {
  /** Titre du poste / offre */
  jobTitle: string;
  /** Description de l'offre (extrait) */
  jobDescription: string;
  /** Thèmes qui ont matché (pour personnaliser le message) */
  matchedThemes: string[];
  /** Résumé audit SEO si disponible */
  seoAuditSummary?: {
    score: number;
    websiteUrl: string;
  };
  /** Infos entreprise (secteur, besoins) */
  companyInfo: CompanyAnalysisResult;
}

/** Proposition commerciale générée */
export interface CommercialProposal {
  /** Titre accrocheur (objet / sujet) */
  title: string;
  /** Message de prospection personnalisé */
  message: string;
}

// ========== Données stockées (DB) ==========

/** Thèmes de recherche stockés (linkedin_job_searches.analysis_themes) */
export type AnalysisThemes = string[];

/** Statut de la proposition (linkedin_companies.proposal_status) */
export type ProposalStatus = 'draft' | 'sent' | 'responded';
