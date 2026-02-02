-- Raison de l'échec de génération de proposition (affichée dans Entreprises enrichies)
ALTER TABLE public.linkedin_companies
  ADD COLUMN IF NOT EXISTS proposal_error TEXT;

COMMENT ON COLUMN public.linkedin_companies.proposal_error IS 'Message d''erreur si la génération de proposition (generate-commercial-proposal) a échoué ; null si succès ou non tenté.';
