# Prompt pour Claude : résoudre l’erreur Edge Function « analyze-seo-comparison »

---

## Prompt à copier-coller pour Claude (après push sur GitHub)

```
On a une erreur sur l’Edge Function Supabase "analyze-seo-comparison" (analyse IA comparatif SEO Mobile vs Desktop avec OpenAI GPT-4o-mini).

L’utilisateur voit : "L’Edge Function a renvoyé une erreur. Redéployez avec : npx supabase functions deploy analyze-seo-comparison. Vérifiez aussi OPENAI_API_KEY dans Supabase (Edge Functions → Secrets)."

En amont, le SDK renvoie "Edge Function returned a non-2xx status code" donc on ne sait pas si c’est : fonction pas redéployée, OPENAI_API_KEY manquante, ou autre (502, timeout, etc.).

Dans ce repo, lis le fichier docs/PROMPT_EDGE_FUNCTION_ANALYZE_SEO.md pour le contexte complet, puis les fichiers indiqués (supabase/functions/analyze-seo-comparison/index.ts, src/modules/kernel/hooks/useAIComparison.ts, types dans seoReport.ts).

Merci de :
1) Vérifier que la fonction renvoie bien toujours HTTP 200 avec { success, error? } en JSON.
2) Proposer les corrections si tu vois une cause au non-2xx.
3) Donner les étapes précises pour déployer la fonction et configurer OPENAI_API_KEY dans Supabase (Secrets).
4) Suggérer comment déboguer (logs Edge Function, statut HTTP réel) pour identifier la cause exacte.
```
---

## Contexte du projet

- **Stack** : React (Vite) + TypeScript, Supabase (Auth, DB, Edge Functions).
- **Fonctionnalité concernée** : onglet **Comparatif** dans le rapport SEO. L’utilisateur peut lancer une **analyse IA** qui compare les scores Mobile vs Desktop (Lighthouse) et génère des recommandations via **OpenAI GPT-4o-mini**.

## Problème à résoudre

Quand l’utilisateur clique sur **« Générer l’analyse IA »** dans l’onglet Comparatif, l’appel à l’Edge Function échoue et l’interface affiche :

> **L’Edge Function a renvoyé une erreur. Redéployez avec : npx supabase functions deploy analyze-seo-comparison. Vérifiez aussi OPENAI_API_KEY dans Supabase (Edge Functions → Secrets).**

En amont, le SDK Supabase renvoie une erreur **« Edge Function returned a non-2xx status code »** : la fonction (ou la plateforme) renvoie donc un code HTTP non 2xx (400, 500, 502, etc.), et on ne voit pas le message d’erreur précis renvoyé par la fonction.

## Ce qui a déjà été fait

1. **Edge Function** (`supabase/functions/analyze-seo-comparison/index.ts`) :
   - La fonction a été modifiée pour **toujours renvoyer un statut HTTP 200**, avec un corps JSON :
     - Succès : `{ success: true, analysis, priority, key_issues }`
     - Erreur : `{ success: false, error: "message détaillé" }`
   - Tous les chemins d’erreur (JSON invalide, champs manquants, `OPENAI_API_KEY` absente, erreur OpenAI, exception) utilisent `jsonResponse({ success: false, error: "..." })` avec **status 200**.
   - Gestion CORS et méthode POST uniquement (OPTIONS + POST).

2. **Client** (`src/modules/kernel/hooks/useAIComparison.ts`) :
   - Appel via `supabase.functions.invoke("analyze-seo-comparison", { body: data })`.
   - En cas d’erreur `FunctionsHttpError`, le hook tente de lire le corps de la réponse (`context`) pour afficher `body.error` si présent.
   - Sinon, affichage du message générique ci-dessus (redéploiement + OPENAI_API_KEY).

3. **Hypothèses actuelles** (à vérifier / corriger) :
   - La fonction n’a peut‑être **pas été redéployée** après les changements (donc l’ancienne version renvoie encore 400/500).
   - Le secret **OPENAI_API_KEY** n’est peut‑être **pas configuré** dans Supabase (Project Settings → Edge Functions → Secrets), ce qui ferait renvoyer une erreur par la fonction (avant ou après déploiement).
   - Problème côté **passerelle Supabase** (502/504, timeout) avant même d’atteindre notre code.

## Fichiers importants (à lire dans le repo)

| Rôle | Chemin |
|------|--------|
| Edge Function (Deno) | `supabase/functions/analyze-seo-comparison/index.ts` |
| Hook client (appel + gestion erreur) | `src/modules/kernel/hooks/useAIComparison.ts` |
| Types payload / réponse | `src/modules/kernel/types/seoReport.ts` (interfaces `AnalyzeSEOComparisonPayload`, `AnalyzeSEOComparisonResponse`) |
| Appel du hook + construction du payload | `src/modules/kernel/components/SEOReport/ReportComparison.tsx` et `SEOReportViewer.tsx` (construction de `AnalyzeSEOComparisonPayload`) |

## Comportement attendu

1. L’utilisateur ouvre un rapport SEO avec des données Mobile et Desktop.
2. Il va dans l’onglet **Comparatif** et clique sur **Générer l’analyse IA**.
3. Le front envoie un POST au corps JSON contenant notamment : `website_url`, `mobile_scores`, `desktop_scores`, et optionnellement `mobile_metrics`, `desktop_metrics`, etc. (voir `AnalyzeSEOComparisonPayload`).
4. L’Edge Function lit `OPENAI_API_KEY` via `Deno.env.get("OPENAI_API_KEY")`, appelle l’API OpenAI (`/v1/chat/completions`, modèle `gpt-4o-mini`, `response_format: { type: "json_object" }`), parse la réponse et renvoie **toujours** un HTTP 200 avec soit `{ success: true, ... }` soit `{ success: false, error: "..." }`.
5. Le client affiche soit l’analyse (markdown + priorité + key_issues), soit le message `error` contenu dans la réponse.

## Ce qu’on te demande

1. **Vérifier** que le code de l’Edge Function et du client est cohérent avec ce qui est décrit ci‑dessus (notamment : tous les retours d’erreur en 200 + JSON avec `success` / `error`).
2. **Proposer** des corrections ou des améliorations si tu repères une cause probable du non‑2xx (ex. : erreur avant le `return`, timeout, problème de déploiement ou de secrets).
3. **Indiquer** les étapes précises pour :
   - Déployer la fonction : `npx supabase functions deploy analyze-seo-comparison` (et éventuellement lien vers la doc Supabase Edge Functions).
   - Configurer **OPENAI_API_KEY** dans Supabase (Edge Functions → Secrets), sans exposer la clé dans le repo.
4. Si possible, **suggérer** un moyen de déboguer côté Supabase (logs Edge Function, vérification du statut HTTP réel renvoyé) pour confirmer si l’erreur vient de notre code, de la clé API ou de la plateforme.

Une fois les changements faits (et ce fichier poussé sur GitHub), on pourra repartir de ce prompt et du code à jour pour continuer le débogage si le problème persiste.
