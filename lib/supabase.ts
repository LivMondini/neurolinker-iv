// Cliente Supabase e funções de acesso aos dados do NeuroLinker.
// As chaves vêm do .env.local (reinicie o servidor depois de editar esse arquivo).
import { createClient } from "@supabase/supabase-js"
import type { PatientSummary, EngagementLevel } from "@/lib/neurolinker-data"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local (reinicie o servidor depois de editar)."
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ---------------------------------------------------------------------------
// Pacientes
// ---------------------------------------------------------------------------

// Nunca use select("*") aqui: pin e pin_hash não podem ir para o navegador.
const COLUNAS_PACIENTE =
  "id, name, age, stage, avatar_url, status, last_activity, engagement, engagement_score, created_at"

export type PacienteRow = {
  id: string
  name: string
  age: number
  stage: string
  avatar_url: string | null
  status: string
  last_activity: string | null
  engagement: string | null
  engagement_score: number | null
  created_at: string
}

// Converte a linha do banco (snake_case) para o formato que as telas usam.
export function rowToPatient(r: PacienteRow): PatientSummary {
  return {
    id: r.id,
    name: r.name,
    age: r.age,
    stage: r.stage,
    avatarUrl: r.avatar_url || "/placeholder-user.jpg",
    lastActivity: r.last_activity ?? "Ainda sem atividade",
    engagement: (r.engagement ?? "Médio") as EngagementLevel,
    engagementScore: r.engagement_score ?? 0,
    status: (r.status ?? "Ativo") as PatientSummary["status"],
  }
}

// A RLS garante que só voltam os pacientes do cuidador logado.
export async function fetchPacientes(): Promise<PacienteRow[]> {
  const { data, error } = await supabase
    .from("pacientes")
    .select(COLUNAS_PACIENTE)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as PacienteRow[]
}

// Cria o paciente no banco (função criar_paciente) e devolve o PIN gerado UMA vez.
// No banco só existe o hash do PIN; o caregiver_id vem do auth.uid().
export async function addPaciente(dados: {
  name: string
  age: number
  stage: string
  avatarUrl?: string
}): Promise<{ paciente: PacienteRow; pin: string }> {
  const { data, error } = await supabase.rpc("criar_paciente", {
    p_name: dados.name,
    p_age: dados.age,
    p_stage: dados.stage,
    p_avatar_url: dados.avatarUrl ?? null,
  })
  if (error) throw error

  const criado = Array.isArray(data) ? data[0] : data

  const { data: paciente, error: erroBusca } = await supabase
    .from("pacientes")
    .select(COLUNAS_PACIENTE)
    .eq("id", criado.paciente_id)
    .single()
  if (erroBusca) throw erroBusca

  return { paciente: paciente as PacienteRow, pin: criado.pin_gerado }
}

// Gera um PIN novo e único para o paciente (função redefinir_pin).
// O PIN antigo deixa de funcionar na hora; o novo é devolvido UMA vez.
export async function redefinirPin(pacienteId: string): Promise<string> {
  const { data, error } = await supabase.rpc("redefinir_pin", {
    p_paciente_id: pacienteId,
  })
  if (error) throw error
  return data as string
}

// Verifica o PIN no banco (função verificar_pin), sem trazer o hash para o navegador.
// Só funciona com cuidador logado: a função roda com as permissões dele (RLS).
export async function verificarPin(pacienteId: string, pin: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("verificar_pin", {
    p_paciente_id: pacienteId,
    p_pin: pin,
  })
  if (error) throw error
  return data === true
}

// ---------------------------------------------------------------------------
// Memórias (fotos, áudios, relatos de vida)
// ATENÇÃO: a tabela "memorias" ainda não existe. Crie-a com RLS antes de usar.
// ---------------------------------------------------------------------------

export async function fetchMemorias(pacienteId: string) {
  const { data, error } = await supabase
    .from("memorias")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function uploadMemoria(dados: {
  pacienteId: string
  type: "photo" | "audio" | "text"
  label: string
  mediaUrl?: string
  content?: string
}) {
  const { data, error } = await supabase
    .from("memorias")
    .insert({
      paciente_id: dados.pacienteId,
      type: dados.type,
      label: dados.label,
      media_url: dados.mediaUrl ?? null,
      content: dados.content ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Perguntas do Jogo da Memória (Verdadeiro/Falso)
// ATENÇÃO: a tabela "perguntas_jogo" ainda não existe. Crie-a com RLS antes de usar.
// ---------------------------------------------------------------------------

export async function fetchPerguntasJogo(pacienteId: string) {
  const { data, error } = await supabase
    .from("perguntas_jogo")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function addPerguntaJogo(dados: {
  pacienteId: string
  question: string
  correctAnswer: boolean
  category: string
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
    .single()
  if (error) throw error
  return data
}