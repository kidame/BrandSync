/**
 * Fonction utilitaire : appelle la Edge Function analyze-job-offer.
 * Typage strict, gestion des erreurs réseau et des réponses OpenAI.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  JobOfferAnalysisResult,
  AnalyzeJobOfferInput,
} from "./types";

/** Réponse en cas de succès */
export interface AnalyzeJobOfferSuccess {
  success: true;
  data: JobOfferAnalysisResult;
}

/** Réponse en cas d'échec (réseau, Edge Function, OpenAI) */
export interface AnalyzeJobOfferError {
  success: false;
  error: string;
}

export type AnalyzeJobOfferResponse = AnalyzeJobOfferSuccess | AnalyzeJobOfferError;

/**
 * Appelle la Edge Function analyze-job-offer avec la description de l'offre et les thèmes.
 * Gère les erreurs réseau et les erreurs renvoyées par l'API (OpenAI, validation).
 *
 * @param input - Description de l'offre et liste de thèmes (interprétés largement par l'IA)
 * @returns Réponse typée { success, data } ou { success, error }
 */
export async function analyzeJobOffer(
  input: AnalyzeJobOfferInput
): Promise<AnalyzeJobOfferResponse> {
  const { jobDescription, themes } = input;

  if (!jobDescription?.trim()) {
    return {
      success: false,
      error: "La description de l'offre est requise et ne doit pas être vide.",
    };
  }

  const themesArray = Array.isArray(themes) ? themes : [themes].filter(Boolean);
  if (themesArray.length === 0) {
    return {
      success: false,
      error: "Au moins un thème est requis pour l'analyse.",
    };
  }

  let data: unknown;
  let invokeError: Error | null = null;

  try {
    const result = await supabase.functions.invoke("analyze-job-offer", {
      body: {
        job_description: jobDescription.trim(),
        themes: themesArray,
      },
    });
    data = result.data;
    invokeError = result.error ?? null;
  } catch (networkError) {
    const message =
      networkError instanceof Error
        ? networkError.message
        : "Erreur réseau lors de l'appel à l'analyse.";
    return { success: false, error: message };
  }

  // Erreur Supabase (réseau, timeout, fonction non déployée, etc.)
  if (invokeError) {
    return {
      success: false,
      error: invokeError.message || "Erreur lors de l'appel à la fonction d'analyse.",
    };
  }

  const response = data as { success?: boolean; error?: string; data?: JobOfferAnalysisResult } | null;

  // Réponse explicite d'échec de la Edge Function (validation, OpenAI, etc.)
  if (response && typeof response === "object" && response.success === false) {
    const errorMessage =
      typeof response.error === "string"
        ? response.error
        : "L'analyse a échoué (réponse serveur).";
    return { success: false, error: errorMessage };
  }

  // Succès : response.data contient le JobOfferAnalysisResult
  const result = response?.data;
  if (!result || typeof result !== "object") {
    return {
      success: false,
      error: "Réponse invalide : résultat d'analyse absent ou mal formé.",
    };
  }

  // Validation minimale du schéma attendu
  if (typeof result.isRelevant !== "boolean") {
    return {
      success: false,
      error: "Réponse invalide : isRelevant manquant ou incorrect.",
    };
  }
  if (!Array.isArray(result.matchedThemes)) result.matchedThemes = [];
  if (typeof result.confidence !== "number") result.confidence = 0;
  if (!Array.isArray(result.detectedConcepts)) result.detectedConcepts = [];
  if (typeof result.reason !== "string") result.reason = "";

  return { success: true, data: result };
}
