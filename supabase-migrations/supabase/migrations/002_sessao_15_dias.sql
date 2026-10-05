-- ============================================================
-- NeuroLinker - migration 002
-- Troca a sessão do paciente de "expira em 12h fixas" para
-- "expira se ficar 15 dias sem uso" (renova a cada acesso).
-- Rode depois da 001.
-- ============================================================

BEGIN;

ALTER TABLE public.sessoes_paciente
  DROP COLUMN IF EXISTS expires_at;

ALTER TABLE public.sessoes_paciente
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz NOT NULL DEFAULT now();

-- ============================================================
-- _sessao_paciente: agora valida pela janela de 15 dias e
-- RENOVA o last_used_at a cada chamada válida (sliding window).
-- ============================================================

CREATE OR REPLACE FUNCTION public._sessao_paciente(p_session_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_paciente_id uuid;
  v_sessao_id uuid;
BEGIN
  IF p_session_token IS NULL OR length(p_session_token) <> 64 THEN
    RETURN NULL;
  END IF;

  SELECT s.id, s.paciente_id INTO v_sessao_id, v_paciente_id
  FROM public.sessoes_paciente s
  JOIN public.dispositivos d ON d.id = s.dispositivo_id
  WHERE s.token_hash = encode(digest(p_session_token, 'sha256'), 'hex')
    AND s.last_used_at > now() - interval '15 days'
    AND d.revoked_at IS NULL;

  IF v_sessao_id IS NOT NULL THEN
    UPDATE public.sessoes_paciente SET last_used_at = now() WHERE id = v_sessao_id;
  END IF;

  RETURN v_paciente_id;
END;
$$;

-- paciente_entrar: a criação da sessão não muda (DEFAULT now() cuida do last_used_at)

COMMIT;
