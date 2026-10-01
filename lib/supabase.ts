// Estrutura de conexão com Supabase (preparação para integração futura).
// Substitua as variáveis de ambiente fictícias abaixo pelas credenciais reais do projeto
// em Settings > Vars, ou conecte a integração Supabase do v0 para que elas sejam
// preenchidas automaticamente.
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ---------------------------------------------------------------------------
// Pacientes
// ---------------------------------------------------------------------------

export async function fetchPacientes() {
  const { data, error } = await supabase.from("pacientes").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function addPaciente(dados: {
  name: string
  age: number
  stage: string
  avatarUrl?: string
}) {
  const { data, error } = await supabase
    .from("pacientes")
    .insert({ name: dados.name, age: dados.age, stage: dados.stage, avatar_url: dados.avatarUrl ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Memórias (fotos, áudios, relatos de vida)
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
