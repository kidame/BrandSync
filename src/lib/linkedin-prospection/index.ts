/**
 * Module prospection LinkedIn intelligente.
 * Export des types et des helpers (analyse offres, enrichissement, propositions).
 */

export type {
  JobOfferAnalysisResult,
  AnalyzeJobOfferInput,
  CompanyAnalysisResult,
  GenerateProposalInput,
  CommercialProposal,
  AnalysisThemes,
  ProposalStatus,
} from "./types";

export { analyzeJobOffer } from "./analyzeJobOffer";
export type { AnalyzeJobOfferResponse, AnalyzeJobOfferSuccess, AnalyzeJobOfferError } from "./analyzeJobOffer";
