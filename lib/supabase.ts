// Cliente Supabase e funções de acesso aos dados do NeuroLinker.
// As chaves vêm do .env.local (reinicie o servidor depois de editar esse arquivo).
import { createClient } from "@supabase/supabase-js";
import type { PatientSummary, EngagementLevel } from "@/lib/neurolinker-data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local (reinicie o servidor depois de editar).",
  );
}

// Detecta ANTES de o client limpar a URL se a página foi aberta pelo link de
// "Esqueci minha senha" (o React só monta depois, e aí a marca já sumiu).
let recuperandoSenha =
  typeof window !== "undefined" &&
  window.location.hash.includes("type=recovery");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") recuperandoSenha = true;
  });
}

export function emRecuperacaoDeSenha() {
  return recuperandoSenha;
}

export function encerrarRecuperacaoDeSenha() {
  recuperandoSenha = false;
}

// ---------------------------------------------------------------------------
// Estágio: o banco só aceita 'Inicial' | 'Moderado' | 'Avançado' (CHECK constraint).
// O front pode continuar mostrando "Estágio Moderado" etc; a conversão fica aqui,
// então nenhuma tela precisa saber do formato exigido pelo banco.
// ---------------------------------------------------------------------------

export type StageDb = "Inicial" | "Moderado" | "Avançado";
const STAGE_DB_VALUES: StageDb[] = ["Inicial", "Moderado", "Avançado"];

// Aceita tanto "Moderado" quanto "Estágio Moderado" (e variações de espaço/acento simples).
export function stageToDb(stage: string): StageDb {
  const limpo = stage.trim();
  const direto = STAGE_DB_VALUES.find(
    (v) => v.toLowerCase() === limpo.toLowerCase(),
  );
  if (direto) return direto;

  const semPrefixo = limpo.replace(/^est[aá]gio\s+/i, "").trim();
  const encontrado = STAGE_DB_VALUES.find(
    (v) => v.toLowerCase() === semPrefixo.toLowerCase(),
  );
  if (encontrado) return encontrado;

  throw new Error(
    `Estágio "${stage}" inválido. Use um de: ${STAGE_DB_VALUES.join(", ")} (com ou sem o prefixo "Estágio").`,
  );
}

// Formato para exibir na tela (igual ao que o mock já usava).
export function stageToDisplay(stageDb: string): string {
  return `Estágio ${stageDb}`;
}

// ---------------------------------------------------------------------------
// Pacientes
// ---------------------------------------------------------------------------

// Nunca use select("*") aqui: pin e pin_hash não podem ir para o navegador.
const COLUNAS_PACIENTE =
  "id, name, age, stage, avatar_url, status, last_activity, engagement, engagement_score, created_at";

export type PacienteRow = {
  id: string;
  name: string;
  age: number;
  stage: string;
  avatar_url: string | null;
  status: string;
  last_activity: string | null;
  engagement: string | null;
  engagement_score: number | null;
  created_at: string;
};

// Converte a linha do banco (snake_case) para o formato que as telas usam.
export function rowToPatient(r: PacienteRow): PatientSummary {
  return {
    id: r.id,
    name: r.name,
    age: r.age,
    stage: stageToDisplay(r.stage),
    avatarUrl: r.avatar_url || "/placeholder-user.jpg",
    lastActivity: r.last_activity ?? "Ainda sem atividade",
    engagement: (r.engagement ?? "Médio") as EngagementLevel,
    engagementScore: r.engagement_score ?? 0,
    status: (r.status ?? "Ativo") as PatientSummary["status"],
  };
}

// A RLS garante que só voltam os pacientes do cuidador logado.
export async function fetchPacientes(): Promise<PacienteRow[]> {
  const { data, error } = await supabase
    .from("pacientes")
    .select(COLUNAS_PACIENTE)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as PacienteRow[];
}

// Cria o paciente no banco (função criar_paciente) e devolve o PIN gerado UMA vez.
// No banco só existe o hash do PIN; o caregiver_id vem do auth.uid().
// `dados.stage` pode vir como "Moderado" ou "Estágio Moderado" — ambos funcionam.
export async function addPaciente(dados: {
  name: string;
  age: number;
  stage: string;
  avatarUrl?: string;
}): Promise<{ paciente: PacienteRow; pin: string }> {
  const stageDb = stageToDb(dados.stage);

  const { data, error } = await supabase.rpc("criar_paciente", {
    p_name: dados.name,
    p_age: dados.age,
    p_stage: stageDb,
    p_avatar_url: dados.avatarUrl ?? null,
  });
  if (error) throw error;

  const criado = Array.isArray(data) ? data[0] : data;

  const { data: paciente, error: erroBusca } = await supabase
    .from("pacientes")
    .select(COLUNAS_PACIENTE)
    .eq("id", criado.paciente_id)
    .single();
  if (erroBusca) throw erroBusca;

  return { paciente: paciente as PacienteRow, pin: criado.pin_gerado };
}

// Gera um PIN novo para o paciente (função redefinir_pin).
// O PIN antigo deixa de funcionar na hora, e todas as sessões abertas do
// paciente são encerradas (ele vai precisar digitar o PIN novo).
export async function redefinirPin(pacienteId: string): Promise<string> {
  const { data, error } = await supabase.rpc("redefinir_pin", {
    p_paciente_id: pacienteId,
  });
  if (error) throw error;
  return data as string;
}

// ---------------------------------------------------------------------------
// Dispositivos do paciente (opção A: aparelho vinculado + PIN)
// ---------------------------------------------------------------------------

export type DispositivoRow = {
  id: string;
  caregiver_id: string;
  paciente_id: string;
  nome: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

// Chamado pelo CUIDADOR, no aparelho do idoso (ou mandando o token por um canal seguro).
// O token só aparece aqui, uma vez. Guarde-o no aparelho do paciente (ver salvarTokenDispositivo).
// Preferir o fluxo de código de pareamento abaixo; isto fica como via alternativa.
export async function vincularDispositivo(
  pacienteId: string,
  nomeAparelho?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("vincular_dispositivo", {
    p_paciente_id: pacienteId,
    p_nome: nomeAparelho ?? null,
  });
  if (error) throw error;
  return data as string;
}

// Chamado pelo CUIDADOR logado, no PRÓPRIO aparelho (ex.: o dashboard).
// Gera um código de 8 caracteres, válido por 10 minutos, para digitar no
// aparelho do idoso. Qualquer código anterior não usado desse paciente é invalidado.
export async function gerarCodigoPareamento(
  pacienteId: string,
): Promise<{ codigo: string; expiraEm: string }> {
  const { data, error } = await supabase.rpc("gerar_codigo_pareamento", {
    p_paciente_id: pacienteId,
  });
  if (error) throw error;
  const linha = Array.isArray(data) ? data[0] : data;
  return { codigo: linha.codigo, expiraEm: linha.expira_em };
}

// Chamado SEM login, no aparelho do idoso. Troca o código de 8 caracteres pelo
// token de dispositivo, e já guarda o token neste aparelho.
export async function parearDispositivo(
  codigo: string,
  nomeAparelho?: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("parear_dispositivo", {
    p_codigo: codigo.trim().toUpperCase(),
    p_nome: nomeAparelho ?? null,
  });
  if (error) throw error;
  salvarTokenDispositivo(data as string);
}

export async function listarDispositivos(
  pacienteId: string,
): Promise<DispositivoRow[]> {
  const { data, error } = await supabase
    .from("dispositivos")
    .select(
      "id, caregiver_id, paciente_id, nome, last_used_at, revoked_at, created_at",
    )
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as DispositivoRow[];
}

export async function revogarDispositivo(dispositivoId: string): Promise<void> {
  const { error } = await supabase.rpc("revogar_dispositivo", {
    p_dispositivo_id: dispositivoId,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Armazenamento local do token de dispositivo (fica no aparelho do idoso).
// Não é segredo de altíssimo valor isolado (precisa também do PIN para logar),
// mas protege o vínculo "este aparelho pertence a este paciente".
// ---------------------------------------------------------------------------

const DEVICE_TOKEN_KEY = "neurolinker_device_token";
const SESSION_TOKEN_KEY = "neurolinker_session_token";

export function salvarTokenDispositivo(token: string) {
  if (typeof window !== "undefined")
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
}

export function obterTokenDispositivo(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEVICE_TOKEN_KEY);
}

export function limparTokenDispositivo() {
  if (typeof window !== "undefined") localStorage.removeItem(DEVICE_TOKEN_KEY);
}

function salvarTokenSessao(token: string) {
  if (typeof window !== "undefined")
    localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function obterTokenSessao(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function limparTokenSessao() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Login do paciente por PIN (sem conta no Supabase Auth)
// ---------------------------------------------------------------------------

export type PacienteEntrarResultado =
  | { ok: true; sessionToken: string }
  | {
      ok: false;
      motivo:
        | "dispositivo_invalido"
        | "bloqueado"
        | "pin_invalido"
        | "pin_incorreto";
      tentativasRestantes?: number;
      bloqueadoAte?: string;
    };

// Confere o PIN no banco (função paciente_entrar). Não precisa de login do cuidador.
// Em caso de sucesso, já guarda o token de sessão no aparelho.
export async function pacienteEntrar(
  pin: string,
): Promise<PacienteEntrarResultado> {
  const deviceToken = obterTokenDispositivo();
  if (!deviceToken) {
    return { ok: false, motivo: "dispositivo_invalido" };
  }

  const { data, error } = await supabase.rpc("paciente_entrar", {
    p_device_token: deviceToken,
    p_pin: pin,
  });
  if (error) throw error;

  if (data.ok) {
    salvarTokenSessao(data.session_token);
    return { ok: true, sessionToken: data.session_token };
  }

  return {
    ok: false,
    motivo: data.reason,
    tentativasRestantes: data.attempts_left,
    bloqueadoAte: data.locked_until,
  };
}

export type BaulData = {
  paciente: {
    id: string;
    name: string;
    avatar_url: string | null;
    stage: string;
  };
  memorias: Array<{
    id: string;
    type: "photo" | "audio" | "text";
    label: string;
    media_path: string | null;
    content: string | null;
    created_at: string;
    url?: string | null;
  }>;
  perguntas: Array<{
    id: string;
    question: string;
    correct_answer: boolean;
    category: string;
  }>;
};

// Busca os dados do baú usando o token de SESSÃO (gerado por pacienteEntrar).
// Retorna null se a sessão expirou (mais de 15 dias sem uso) ou é inválida,
// o que significa: mostre a tela de PIN de novo.
export async function obterBaul(): Promise<BaulData | null> {
  const sessionToken = obterTokenSessao();
  if (!sessionToken) return null;

  const { data, error } = await supabase.rpc("paciente_obter_baul", {
    p_session_token: sessionToken,
  });
  if (error) throw error;

  if (!data.ok) {
    limparTokenSessao();
    return null;
  }

  return {
    paciente: data.paciente,
    memorias: data.memorias,
    perguntas: data.perguntas,
  };
}

export async function pacienteSair(): Promise<void> {
  const sessionToken = obterTokenSessao();
  if (sessionToken) {
    try {
      await supabase.rpc("paciente_sair", { p_session_token: sessionToken });
    } catch {
      // mesmo se der erro no servidor, limpa localmente
    }
  }
  limparTokenSessao();
}

// ---------------------------------------------------------------------------
// Memórias (fotos, áudios, relatos de vida)
// media_path é o caminho dentro de um bucket PRIVADO do Storage — nunca uma
// URL pública. Para exibir, gere uma signed URL a partir desse caminho.
// ---------------------------------------------------------------------------

export async function fetchMemorias(pacienteId: string) {
  const { data, error } = await supabase
    .from("memorias")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function uploadMemoria(dados: {
  pacienteId: string;
  type: "photo" | "audio" | "text";
  label: string;
  mediaPath?: string;
  content?: string;
}) {
  const { data, error } = await supabase
    .from("memorias")
    .insert({
      paciente_id: dados.pacienteId,
      type: dados.type,
      label: dados.label,
      media_path: dados.mediaPath ?? null,
      content: dados.content ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Perguntas do Jogo da Memória (Verdadeiro/Falso)
// ---------------------------------------------------------------------------

export async function fetchPerguntasJogo(pacienteId: string) {
  const { data, error } = await supabase
    .from("perguntas_jogo")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addPerguntaJogo(dados: {
  pacienteId: string;
  question: string;
  correctAnswer: boolean;
  category: string;
}) {
  const { data, error } = await supabase
    .from("perguntas_jogo")
    .insert({
      paciente_id: dados.pacienteId,
      question: dados.question,
      correct_answer: dados.correctAnswer,
      category: dados.category,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Storage de mídias (bucket privado "memorias")
// ---------------------------------------------------------------------------

// Envia o arquivo para {pacienteId}/{uuid}-{nome} e devolve o caminho (path).
export async function uploadArquivoMemoria(
  pacienteId: string,
  file: File,
): Promise<string> {
  const nomeSeguro = file.name.replace(/[^\w.\-]/g, "_");
  const path = `${pacienteId}/${crypto.randomUUID()}-${nomeSeguro}`;

  const { error } = await supabase.storage.from("memorias").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  return path;
}

// Gera uma URL temporária para exibir a mídia (o bucket é privado).
export async function obterUrlAssinada(
  path: string,
  segundos = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("memorias")
    .createSignedUrl(path, segundos);
  if (error) throw error;
  return data.signedUrl;
}

// Baú do paciente já com URLs das mídias (via rota do servidor)
export async function obterBaulComMidia() {
  const sessionToken = obterTokenSessao();
  if (!sessionToken) return null;

  const res = await fetch("/api/baul-midia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionToken }),
  });
  if (!res.ok) {
    limparTokenSessao();
    return null;
  }
  return await res.json();
}
