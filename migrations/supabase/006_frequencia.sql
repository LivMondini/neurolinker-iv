-- ============================================================
-- NeuroLinker - migration 006: frequência de atividade
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.eventos_atividade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrou','abriu_baul','memoria_do_dia','jogo')),
  detalhe jsonb NOT NULL DEFAULT '{}'::jsonb,   -- ex.: {"acertos":4,"total":5}
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (paciente_id, caregiver_id)
    REFERENCES public.pacientes (id, caregiver_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_eventos_paciente_data
  ON public.eventos_atividade (paciente_id, created_at DESC);

ALTER TABLE public.eventos_atividade ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eventos_atividade FROM anon, authenticated;

-- Cuidador só lê os eventos dos próprios pacientes
CREATE POLICY eventos_select_own ON public.eventos_atividade
  FOR SELECT TO authenticated USING (caregiver_id = (SELECT auth.uid()));
GRANT SELECT ON public.eventos_atividade TO authenticated;

-- ------------------------------------------------------------
-- Paciente registra atividade (token de sessão; sem login)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.paciente_registrar_atividade(
  p_session_token text, p_tipo text, p_detalhe jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_pid uuid;
  v_cid uuid;
BEGIN
  IF p_tipo NOT IN ('entrou','abriu_baul','memoria_do_dia','jogo') THEN
    RETURN;
  END IF;

  v_pid := public._sessao_paciente(p_session_token);
  IF v_pid IS NULL THEN RETURN; END IF;

  SELECT caregiver_id INTO v_cid FROM public.pacientes WHERE id = v_pid;

  INSERT INTO public.eventos_atividade (caregiver_id, paciente_id, tipo, detalhe)
  VALUES (v_cid, v_pid, p_tipo, COALESCE(p_detalhe, '{}'::jsonb));

  UPDATE public.pacientes SET last_activity = now() WHERE id = v_pid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.paciente_registrar_atividade(text,text,jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.paciente_registrar_atividade(text,text,jsonb) TO anon, authenticated;

-- ------------------------------------------------------------
-- Relatório para o cuidador (últimos p_dias, fuso São Paulo)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.relatorio_paciente(p_paciente_id uuid, p_dias int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inicio timestamptz;
  v_total int;
  v_acertos int;
  v_perguntas int;
  v_partidas int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticação requerida.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pacientes WHERE id = p_paciente_id AND caregiver_id = v_uid) THEN
    RAISE EXCEPTION 'Paciente não encontrado ou sem acesso.';
  END IF;

  v_inicio := (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
               - ((p_dias - 1) || ' days')::interval) AT TIME ZONE 'America/Sao_Paulo';

  SELECT count(*), COALESCE(sum((detalhe->>'acertos')::int),0), COALESCE(sum((detalhe->>'total')::int),0)
    INTO v_partidas, v_acertos, v_perguntas
  FROM public.eventos_atividade
  WHERE paciente_id = p_paciente_id AND tipo = 'jogo' AND created_at >= v_inicio;

  SELECT count(*) INTO v_total
  FROM public.eventos_atividade
  WHERE paciente_id = p_paciente_id AND created_at >= v_inicio;

  RETURN jsonb_build_object(
    'total_eventos', v_total,
    'partidas', v_partidas,
    'taxa_acerto', CASE WHEN v_perguntas > 0 THEN round(100.0 * v_acertos / v_perguntas) ELSE NULL END,
    'dias_com_atividade', (
      SELECT count(DISTINCT (created_at AT TIME ZONE 'America/Sao_Paulo')::date)
      FROM public.eventos_atividade
      WHERE paciente_id = p_paciente_id AND created_at >= v_inicio),
    'por_dia', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('dia', d, 'acessos', n) ORDER BY d)
      FROM (
        SELECT (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS d, count(*) AS n
        FROM public.eventos_atividade
        WHERE paciente_id = p_paciente_id AND created_at >= v_inicio
        GROUP BY 1) x), '[]'::jsonb),
    'historico', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'tipo', tipo, 'detalhe', detalhe, 'quando', created_at))
      FROM (SELECT * FROM public.eventos_atividade
            WHERE paciente_id = p_paciente_id
            ORDER BY created_at DESC LIMIT 20) h), '[]'::jsonb)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.relatorio_paciente(uuid,int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.relatorio_paciente(uuid,int) TO authenticated;

COMMIT;
NOTIFY pgrst, 'reload schema';