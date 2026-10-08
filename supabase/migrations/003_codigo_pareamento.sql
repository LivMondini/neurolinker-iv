-- ============================================================
-- NeuroLinker - migration 003
-- Pareamento por código de 8 caracteres (válido por 10 minutos)
-- Rode depois da 001 e da 002.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.codigos_pareamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  codigo text NOT NULL UNIQUE,
  expira_em timestamptz NOT NULL,
  usado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (paciente_id, caregiver_id)
    REFERENCES public.pacientes (id, caregiver_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_codigos_paciente_id
  ON public.codigos_pareamento (paciente_id);

-- Sem policies = ninguém acessa direto; só pelas funções
ALTER TABLE public.codigos_pareamento ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.codigos_pareamento FROM anon, authenticated;

-- ------------------------------------------------------------
-- Gera código (cuidador logado)
-- Alfabeto sem 0/O/1/I para evitar confusão ao digitar.
-- 32 caracteres: 256 % 32 = 0, então não há viés no sorteio.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gerar_codigo_pareamento(p_paciente_id uuid)
RETURNS TABLE (codigo text, expira_em timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
#variable_conflict use_column
DECLARE
  v_uid uuid := auth.uid();
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_codigo text;
  v_expira timestamptz := now() + interval '10 minutes';
  v_tentativa integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação requerida.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = p_paciente_id AND p.caregiver_id = v_uid
  ) THEN
    RAISE EXCEPTION 'Paciente não encontrado ou sem acesso.';
  END IF;

  -- Invalida códigos anteriores não usados e limpa os vencidos
  DELETE FROM public.codigos_pareamento c
  WHERE c.paciente_id = p_paciente_id
    AND (c.usado_em IS NULL OR c.expira_em < now());

  LOOP
    v_tentativa := v_tentativa + 1;
    v_bytes := gen_random_bytes(8);
    v_codigo := '';
    FOR i IN 0..7 LOOP
      v_codigo := v_codigo || substr(v_alfabeto, (get_byte(v_bytes, i) % 32) + 1, 1);
    END LOOP;

    BEGIN
      INSERT INTO public.codigos_pareamento (caregiver_id, paciente_id, codigo, expira_em)
      VALUES (v_uid, p_paciente_id, v_codigo, v_expira);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_tentativa >= 5 THEN RAISE; END IF;
    END;
  END LOOP;

  RETURN QUERY SELECT v_codigo, v_expira;
END;
$$;

-- ------------------------------------------------------------
-- Troca o código pelo token de dispositivo (SEM login)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.parear_dispositivo(
  p_codigo text,
  p_nome text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_cod public.codigos_pareamento%ROWTYPE;
  v_token text;
BEGIN
  SELECT c.* INTO v_cod
  FROM public.codigos_pareamento c
  WHERE c.codigo = upper(btrim(coalesce(p_codigo, '')))
    AND c.usado_em IS NULL
    AND c.expira_em > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'codigo_invalido_ou_expirado';
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');  -- 64 caracteres

  INSERT INTO public.dispositivos (caregiver_id, paciente_id, nome, token_hash)
  VALUES (v_cod.caregiver_id, v_cod.paciente_id, nullif(btrim(p_nome), ''),
          encode(digest(v_token, 'sha256'), 'hex'));

  UPDATE public.codigos_pareamento SET usado_em = now() WHERE id = v_cod.id;

  RETURN v_token;
END;
$$;

-- ------------------------------------------------------------
-- Permissões de execução
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.gerar_codigo_pareamento(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.gerar_codigo_pareamento(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.parear_dispositivo(text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.parear_dispositivo(text, text) TO anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
