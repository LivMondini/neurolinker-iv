-- ============================================================
-- NeuroLinker - migration 001
-- Opção A: paciente acessa por DISPOSITIVO VINCULADO + PIN de 6 dígitos
--
-- Fluxo:
--  1. Cuidador (logado) cria o paciente  -> recebe o PIN uma única vez
--  2. Cuidador (logado) vincula o aparelho do idoso -> recebe um token
--     de dispositivo, que o app do idoso guarda
--  3. Idoso digita o PIN -> app envia token + PIN -> recebe token de sessão
--  4. App do idoso lê o baú (memórias + perguntas) com o token de sessão
--
-- O idoso nunca tem login no Supabase Auth e nunca acessa as tabelas
-- diretamente: só chama as 3 funções paciente_*.
--
-- Use em um projeto Supabase NOVO ou de teste.
-- Se você já rodou a versão anterior, apague antes as tabelas
-- memorias, perguntas_jogo e pacientes (DROP TABLE ... CASCADE).
-- ============================================================

BEGIN;

-- No Supabase o pgcrypto fica no schema "extensions"
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Limpeza de função antiga (versão anterior do SQL)
DROP FUNCTION IF EXISTS public.verificar_pin(uuid, text);

-- ============================================================
-- Tabelas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (btrim(name) <> ''),
  age integer NOT NULL CHECK (age > 0 AND age <= 120),
  stage text NOT NULL CHECK (stage IN ('Inicial', 'Moderado', 'Avançado')),
  avatar_url text,
  status text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Em avaliação')),
  last_activity timestamptz,
  engagement text NOT NULL DEFAULT 'Médio' CHECK (engagement IN ('Alto', 'Médio', 'Baixo')),
  engagement_score integer NOT NULL DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 100),
  pin_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- necessário para as chaves estrangeiras compostas abaixo
  UNIQUE (id, caregiver_id)
);

CREATE INDEX IF NOT EXISTS idx_pacientes_caregiver_id ON public.pacientes (caregiver_id);

-- Chave estrangeira composta (paciente_id, caregiver_id):
-- o banco GARANTE que o caregiver_id da linha é o dono do paciente.

CREATE TABLE IF NOT EXISTS public.memorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL DEFAULT auth.uid(),
  paciente_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('photo', 'audio', 'text')),
  label text NOT NULL CHECK (btrim(label) <> ''),
  media_path text,   -- caminho no Storage (bucket privado), não URL pública
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (paciente_id, caregiver_id)
    REFERENCES public.pacientes (id, caregiver_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_memorias_paciente_id ON public.memorias (paciente_id);
CREATE INDEX IF NOT EXISTS idx_memorias_caregiver_id ON public.memorias (caregiver_id);

CREATE TABLE IF NOT EXISTS public.perguntas_jogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL DEFAULT auth.uid(),
  paciente_id uuid NOT NULL,
  question text NOT NULL CHECK (btrim(question) <> ''),
  correct_answer boolean NOT NULL,
  category text NOT NULL DEFAULT 'Geral',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (paciente_id, caregiver_id)
    REFERENCES public.pacientes (id, caregiver_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_perguntas_paciente_id ON public.perguntas_jogo (paciente_id);
CREATE INDEX IF NOT EXISTS idx_perguntas_caregiver_id ON public.perguntas_jogo (caregiver_id);

-- Aparelhos vinculados. Guarda só o HASH do token.
-- O limite de tentativas de PIN vale POR DISPOSITIVO.
CREATE TABLE IF NOT EXISTS public.dispositivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  nome text,
  token_hash text NOT NULL UNIQUE,
  pin_attempts_left integer NOT NULL DEFAULT 5 CHECK (pin_attempts_left BETWEEN 0 AND 5),
  pin_locked_until timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (paciente_id, caregiver_id)
    REFERENCES public.pacientes (id, caregiver_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dispositivos_paciente_id ON public.dispositivos (paciente_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_caregiver_id ON public.dispositivos (caregiver_id);

-- Sessões curtas do idoso (após acertar o PIN). Guarda só o HASH.
CREATE TABLE IF NOT EXISTS public.sessoes_paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  dispositivo_id uuid NOT NULL REFERENCES public.dispositivos(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '12 hours',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessoes_dispositivo_id ON public.sessoes_paciente (dispositivo_id);

-- ============================================================
-- Trigger updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pacientes_updated_at ON public.pacientes;
CREATE TRIGGER trg_pacientes_updated_at BEFORE UPDATE ON public.pacientes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_memorias_updated_at ON public.memorias;
CREATE TRIGGER trg_memorias_updated_at BEFORE UPDATE ON public.memorias
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_perguntas_updated_at ON public.perguntas_jogo;
CREATE TRIGGER trg_perguntas_updated_at BEFORE UPDATE ON public.perguntas_jogo
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.pacientes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorias         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perguntas_jogo   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes_paciente ENABLE ROW LEVEL SECURITY;  -- sem policies = ninguém acessa

-- Políticas (a checagem de dono do paciente já é garantida pela FK composta)

DROP POLICY IF EXISTS pacientes_select_own ON public.pacientes;
CREATE POLICY pacientes_select_own ON public.pacientes
  FOR SELECT TO authenticated USING (caregiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS pacientes_update_own ON public.pacientes;
CREATE POLICY pacientes_update_own ON public.pacientes
  FOR UPDATE TO authenticated
  USING (caregiver_id = (SELECT auth.uid()))
  WITH CHECK (caregiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS pacientes_delete_own ON public.pacientes;
CREATE POLICY pacientes_delete_own ON public.pacientes
  FOR DELETE TO authenticated USING (caregiver_id = (SELECT auth.uid()));

-- (sem policy de INSERT em pacientes: só a função criar_paciente insere)

DROP POLICY IF EXISTS memorias_all_own ON public.memorias;
CREATE POLICY memorias_all_own ON public.memorias
  FOR ALL TO authenticated
  USING (caregiver_id = (SELECT auth.uid()))
  WITH CHECK (caregiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS perguntas_all_own ON public.perguntas_jogo;
CREATE POLICY perguntas_all_own ON public.perguntas_jogo
  FOR ALL TO authenticated
  USING (caregiver_id = (SELECT auth.uid()))
  WITH CHECK (caregiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS dispositivos_select_own ON public.dispositivos;
CREATE POLICY dispositivos_select_own ON public.dispositivos
  FOR SELECT TO authenticated USING (caregiver_id = (SELECT auth.uid()));

-- ============================================================
-- Privilégios por coluna (o Supabase concede tudo por padrão)
-- ============================================================

REVOKE ALL ON public.pacientes        FROM anon, authenticated;
REVOKE ALL ON public.memorias         FROM anon, authenticated;
REVOKE ALL ON public.perguntas_jogo   FROM anon, authenticated;
REVOKE ALL ON public.dispositivos     FROM anon, authenticated;
REVOKE ALL ON public.sessoes_paciente FROM anon, authenticated;

-- pacientes: pin_hash NUNCA é legível; engagement/last_activity só o sistema altera
GRANT SELECT (id, caregiver_id, name, age, stage, avatar_url, status,
              last_activity, engagement, engagement_score, created_at, updated_at)
  ON public.pacientes TO authenticated;
GRANT UPDATE (name, age, stage, avatar_url, status) ON public.pacientes TO authenticated;
GRANT DELETE ON public.pacientes TO authenticated;

-- memorias
GRANT SELECT ON public.memorias TO authenticated;
GRANT INSERT (caregiver_id, paciente_id, type, label, media_path, content)
  ON public.memorias TO authenticated;
GRANT UPDATE (type, label, media_path, content) ON public.memorias TO authenticated;
GRANT DELETE ON public.memorias TO authenticated;

-- perguntas
GRANT SELECT ON public.perguntas_jogo TO authenticated;
GRANT INSERT (caregiver_id, paciente_id, question, correct_answer, category)
  ON public.perguntas_jogo TO authenticated;
GRANT UPDATE (question, correct_answer, category) ON public.perguntas_jogo TO authenticated;
GRANT DELETE ON public.perguntas_jogo TO authenticated;

-- dispositivos: cuidador só lê (sem token_hash); criar/revogar via função
GRANT SELECT (id, caregiver_id, paciente_id, nome, last_used_at, revoked_at, created_at)
  ON public.dispositivos TO authenticated;

-- ============================================================
-- Funções internas (não chamáveis pela API)
-- ============================================================

CREATE OR REPLACE FUNCTION public.gerar_pin_6digitos()
RETURNS text
LANGUAGE sql
SET search_path = public, extensions, pg_temp
AS $$
  SELECT lpad(
    ((get_byte(b, 0)::bigint * 16777216 +
      get_byte(b, 1)::bigint * 65536 +
      get_byte(b, 2)::bigint * 256 +
      get_byte(b, 3)::bigint) % 1000000)::text,
    6, '0')
  FROM (SELECT gen_random_bytes(4) AS b) t;
$$;

-- Devolve o paciente_id de uma sessão válida (ou NULL)
CREATE OR REPLACE FUNCTION public._sessao_paciente(p_session_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_paciente_id uuid;
BEGIN
  IF p_session_token IS NULL OR length(p_session_token) <> 64 THEN
    RETURN NULL;
  END IF;

  SELECT s.paciente_id INTO v_paciente_id
  FROM public.sessoes_paciente s
  JOIN public.dispositivos d ON d.id = s.dispositivo_id
  WHERE s.token_hash = encode(digest(p_session_token, 'sha256'), 'hex')
    AND s.expires_at > now()
    AND d.revoked_at IS NULL;

  RETURN v_paciente_id;
END;
$$;

-- ============================================================
-- Funções do CUIDADOR (precisam de login)
-- ============================================================

CREATE OR REPLACE FUNCTION public.criar_paciente(
  p_name text,
  p_age integer,
  p_stage text,
  p_avatar_url text DEFAULT NULL
)
RETURNS TABLE (paciente_id uuid, pin_gerado text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_pin text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação requerida.';
  END IF;
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Nome do paciente é obrigatório.';
  END IF;
  IF p_age IS NULL OR p_age <= 0 OR p_age > 120 THEN
    RAISE EXCEPTION 'Idade inválida.';
  END IF;
  IF p_stage IS NULL OR p_stage NOT IN ('Inicial', 'Moderado', 'Avançado') THEN
    RAISE EXCEPTION 'Estágio inválido.';
  END IF;

  v_pin := public.gerar_pin_6digitos();

  INSERT INTO public.pacientes (caregiver_id, name, age, stage, avatar_url, pin_hash)
  VALUES (v_uid, btrim(p_name), p_age, p_stage, p_avatar_url, crypt(v_pin, gen_salt('bf', 10)))
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_pin;
END;
$$;

-- Gera novo PIN. O antigo deixa de valer. Zera bloqueios e derruba sessões abertas.
CREATE OR REPLACE FUNCTION public.redefinir_pin(p_paciente_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_pin text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação requerida.';
  END IF;

  v_pin := public.gerar_pin_6digitos();

  UPDATE public.pacientes
  SET pin_hash = crypt(v_pin, gen_salt('bf', 10))
  WHERE id = p_paciente_id AND caregiver_id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paciente não encontrado ou sem acesso.';
  END IF;

  DELETE FROM public.sessoes_paciente WHERE paciente_id = p_paciente_id;
  UPDATE public.dispositivos
  SET pin_attempts_left = 5, pin_locked_until = NULL
  WHERE paciente_id = p_paciente_id;

  RETURN v_pin;
END;
$$;

-- Vincula um aparelho ao paciente. Devolve o token UMA vez; o app do idoso o guarda.
CREATE OR REPLACE FUNCTION public.vincular_dispositivo(
  p_paciente_id uuid,
  p_nome text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_token text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação requerida.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pacientes WHERE id = p_paciente_id AND caregiver_id = v_uid
  ) THEN
    RAISE EXCEPTION 'Paciente não encontrado ou sem acesso.';
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');  -- 64 caracteres

  INSERT INTO public.dispositivos (caregiver_id, paciente_id, nome, token_hash)
  VALUES (v_uid, p_paciente_id, nullif(btrim(p_nome), ''),
          encode(digest(v_token, 'sha256'), 'hex'));

  RETURN v_token;
END;
$$;

-- Revoga um aparelho (ex.: celular perdido)
CREATE OR REPLACE FUNCTION public.revogar_dispositivo(p_dispositivo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação requerida.';
  END IF;

  UPDATE public.dispositivos
  SET revoked_at = now()
  WHERE id = p_dispositivo_id AND caregiver_id = v_uid AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispositivo não encontrado ou sem acesso.';
  END IF;

  DELETE FROM public.sessoes_paciente WHERE dispositivo_id = p_dispositivo_id;
END;
$$;

-- ============================================================
-- Funções do PACIENTE (sem login; protegidas por token + PIN)
-- Retornam jsonb com "ok" e "reason" em vez de dar erro, porque um
-- RAISE desfaria a contagem de tentativas.
-- ============================================================

CREATE OR REPLACE FUNCTION public.paciente_entrar(p_device_token text, p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_disp public.dispositivos%ROWTYPE;
  v_pin_hash text;
  v_attempts integer;
  v_session text;
  v_lock timestamptz;
BEGIN
  IF p_device_token IS NULL OR length(p_device_token) <> 64 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'dispositivo_invalido');
  END IF;

  SELECT d.* INTO v_disp
  FROM public.dispositivos d
  WHERE d.token_hash = encode(digest(p_device_token, 'sha256'), 'hex')
    AND d.revoked_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'dispositivo_invalido');
  END IF;

  IF v_disp.pin_locked_until IS NOT NULL AND v_disp.pin_locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bloqueado',
                              'locked_until', v_disp.pin_locked_until);
  END IF;

  v_attempts := v_disp.pin_attempts_left;
  IF v_disp.pin_locked_until IS NOT NULL THEN
    v_attempts := 5;  -- o bloqueio expirou: devolve as tentativas
  END IF;

  IF p_pin IS NULL OR p_pin !~ '^[0-9]{6}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'pin_invalido',
                              'attempts_left', v_attempts);
  END IF;

  SELECT p.pin_hash INTO v_pin_hash FROM public.pacientes p WHERE p.id = v_disp.paciente_id;

  IF crypt(p_pin, v_pin_hash) = v_pin_hash THEN
    v_session := encode(gen_random_bytes(32), 'hex');

    DELETE FROM public.sessoes_paciente WHERE dispositivo_id = v_disp.id;
    INSERT INTO public.sessoes_paciente (paciente_id, dispositivo_id, token_hash)
    VALUES (v_disp.paciente_id, v_disp.id, encode(digest(v_session, 'sha256'), 'hex'));

    UPDATE public.dispositivos
    SET pin_attempts_left = 5, pin_locked_until = NULL, last_used_at = now()
    WHERE id = v_disp.id;

    UPDATE public.pacientes SET last_activity = now() WHERE id = v_disp.paciente_id;

    RETURN jsonb_build_object('ok', true, 'session_token', v_session,
                              'expires_in_seconds', 43200);
  END IF;

  -- PIN errado
  v_attempts := v_attempts - 1;

  IF v_attempts <= 0 THEN
    v_lock := now() + interval '15 minutes';
    UPDATE public.dispositivos
    SET pin_attempts_left = 0, pin_locked_until = v_lock
    WHERE id = v_disp.id;
    RETURN jsonb_build_object('ok', false, 'reason', 'bloqueado', 'locked_until', v_lock);
  END IF;

  UPDATE public.dispositivos
  SET pin_attempts_left = v_attempts, pin_locked_until = NULL
  WHERE id = v_disp.id;

  RETURN jsonb_build_object('ok', false, 'reason', 'pin_incorreto',
                            'attempts_left', v_attempts);
END;
$$;

-- Devolve tudo que o baú precisa, somente do paciente da sessão
CREATE OR REPLACE FUNCTION public.paciente_obter_baul(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_pid uuid;
BEGIN
  v_pid := public._sessao_paciente(p_session_token);

  IF v_pid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'sessao_invalida');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'paciente', (
      SELECT jsonb_build_object('id', p.id, 'name', p.name,
                                'avatar_url', p.avatar_url, 'stage', p.stage)
      FROM public.pacientes p WHERE p.id = v_pid
    ),
    'memorias', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', m.id, 'type', m.type, 'label', m.label,
               'media_path', m.media_path, 'content', m.content,
               'created_at', m.created_at) ORDER BY m.created_at DESC)
      FROM public.memorias m WHERE m.paciente_id = v_pid
    ), '[]'::jsonb),
    'perguntas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', q.id, 'question', q.question,
               'correct_answer', q.correct_answer,
               'category', q.category) ORDER BY q.created_at)
      FROM public.perguntas_jogo q WHERE q.paciente_id = v_pid
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.paciente_sair(p_session_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF p_session_token IS NULL OR length(p_session_token) <> 64 THEN
    RETURN;
  END IF;
  DELETE FROM public.sessoes_paciente
  WHERE token_hash = encode(digest(p_session_token, 'sha256'), 'hex');
END;
$$;

-- ============================================================
-- Permissões de execução
-- (o Supabase concede EXECUTE a anon/authenticated por padrão,
--  então é preciso revogar explicitamente de cada um)
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.gerar_pin_6digitos()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._sessao_paciente(text)             FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.criar_paciente(text, integer, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redefinir_pin(uuid)                FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.vincular_dispositivo(uuid, text)   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revogar_dispositivo(uuid)          FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.criar_paciente(text, integer, text, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.redefinir_pin(uuid)                TO authenticated;
GRANT  EXECUTE ON FUNCTION public.vincular_dispositivo(uuid, text)   TO authenticated;
GRANT  EXECUTE ON FUNCTION public.revogar_dispositivo(uuid)          TO authenticated;

REVOKE EXECUTE ON FUNCTION public.paciente_entrar(text, text)        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.paciente_obter_baul(text)          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.paciente_sair(text)                FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.paciente_entrar(text, text)        TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.paciente_obter_baul(text)          TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.paciente_sair(text)                TO anon, authenticated;

COMMIT;

-- ============================================================
-- TESTES MANUAIS (rode depois, um por um, logado como cuidador pelo app
-- ou usando supabase-js; no SQL Editor auth.uid() é NULL)
--
--  1. rpc('criar_paciente', {p_name:'Teste', p_age:78, p_stage:'Inicial'})
--       -> guarde paciente_id e pin_gerado
--  2. rpc('vincular_dispositivo', {p_paciente_id: '<id>', p_nome:'Tablet da sala'})
--       -> guarde o token de 64 caracteres
--  3. (deslogado/anon) rpc('paciente_entrar', {p_device_token:'<token>', p_pin:'000000'})
--       -> {"ok":false,"reason":"pin_incorreto","attempts_left":4}
--  4. 5 erros seguidos -> {"reason":"bloqueado", ...}
--  5. rpc('paciente_entrar', {... PIN correto ...}) -> session_token
--  6. rpc('paciente_obter_baul', {p_session_token:'<session>'}) -> memórias e perguntas
--  7. supabase.from('pacientes').select('pin_hash')  -> deve dar "permission denied"
--  8. Com OUTRO usuário cuidador, tente ler/inserir no paciente do primeiro
--       -> deve falhar
-- ============================================================
