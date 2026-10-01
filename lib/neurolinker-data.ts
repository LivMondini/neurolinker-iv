// NOTA: Este arquivo contém dados mocados para prototipagem.
// Ao integrar com Supabase (ver lib/supabase.ts), substitua:
//   - `patients` pelo resultado de `fetchPacientes()`
//   - `patientReports` por dados agregados vindos das tabelas `partidas_jogo` e `acessos_baul`
//   - `familyMembers`, `lifeTimeline`, `trueFalseQuestions` por `fetchMemorias(pacienteId)` / `fetchPerguntasJogo(pacienteId)`

export type EngagementLevel = "Alto" | "Médio" | "Baixo"

export interface PatientSummary {
  id: string
  name: string
  age: number
  stage: string
  avatarUrl: string
  lastActivity: string
  engagement: EngagementLevel
  engagementScore: number
  status: "Ativo" | "Inativo" | "Em avaliação"
}

export interface FamilyMember {
  id: string
  name: string
  relationship: string
  photoUrl: string
}

export interface TimelineEntry {
  decade: string
  title: string
  description: string
  photoUrl: string
}

export interface TrueFalseQuestion {
  id: string
  question: string
  correctAnswer: boolean
  category: string
}

export const patients: PatientSummary[] = [
  {
    id: "1",
    name: "João Silva",
    age: 78,
    stage: "Estágio Moderado",
    avatarUrl: "/images/seu-joao-avatar.png",
    lastActivity: "Hoje, 09:40",
    engagement: "Alto",
    engagementScore: 86,
    status: "Ativo",
  },
  {
    id: "2",
    name: "Rosa Pereira",
    age: 82,
    stage: "Estágio Inicial",
    avatarUrl: "/placeholder-user.jpg",
    lastActivity: "Ontem, 18:12",
    engagement: "Médio",
    engagementScore: 62,
    status: "Ativo",
  },
  {
    id: "3",
    name: "Antônio Souza",
    age: 85,
    stage: "Estágio Avançado",
    avatarUrl: "/placeholder-user.jpg",
    lastActivity: "3 dias atrás",
    engagement: "Baixo",
    engagementScore: 28,
    status: "Em avaliação",
  },
  {
    id: "4",
    name: "Helena Martins",
    age: 74,
    stage: "Estágio Inicial",
    avatarUrl: "/placeholder-user.jpg",
    lastActivity: "Hoje, 07:55",
    engagement: "Alto",
    engagementScore: 91,
    status: "Ativo",
  },
]

export const familyMembers: FamilyMember[] = [
  {
    id: "maria",
    name: "Maria",
    relationship: "Sua Esposa",
    photoUrl: "/images/esposa-maria.png",
  },
  {
    id: "lucas",
    name: "Lucas",
    relationship: "Seu Neto",
    photoUrl: "/images/neto-lucas.png",
  },
  {
    id: "ana",
    name: "Ana",
    relationship: "Sua Filha",
    photoUrl: "/images/filha-ana.png",
  },
]

export const lifeTimeline: TimelineEntry[] = [
  {
    decade: "Anos 60",
    title: "Primeiros passos como marceneiro",
    description: "João aprendeu o ofício de marceneiro com seu pai, em uma pequena oficina da família.",
    photoUrl: "/images/timeline-1960.png",
  },
  {
    decade: "Anos 70",
    title: "O casamento com Maria",
    description: "Em uma linda cerimônia simples, João e Maria se casaram e começaram sua vida juntos.",
    photoUrl: "/images/timeline-1970.png",
  },
  {
    decade: "Anos 80",
    title: "A chegada dos filhos",
    description: "A casa ficou ainda mais feliz com as festas de aniversário e as risadas das crianças.",
    photoUrl: "/images/timeline-1980.png",
  },
]

export interface WeeklyEngagementPoint {
  day: string
  acessos: number
}

export interface ActivityLogEntry {
  id: string
  description: string
  timestamp: string
}

export interface PatientReport {
  memoryGameAccuracy: number
  totalGamesPlayed: number
  weeklyEngagement: WeeklyEngagementPoint[]
  activityHistory: ActivityLogEntry[]
}

const defaultWeeklyEngagement: WeeklyEngagementPoint[] = [
  { day: "Seg", acessos: 0 },
  { day: "Ter", acessos: 0 },
  { day: "Qua", acessos: 0 },
  { day: "Qui", acessos: 0 },
  { day: "Sex", acessos: 0 },
  { day: "Sáb", acessos: 0 },
  { day: "Dom", acessos: 0 },
]

export const patientReports: Record<string, PatientReport> = {
  "1": {
    memoryGameAccuracy: 86,
    totalGamesPlayed: 42,
    weeklyEngagement: [
      { day: "Seg", acessos: 3 },
      { day: "Ter", acessos: 4 },
      { day: "Qua", acessos: 2 },
      { day: "Qui", acessos: 5 },
      { day: "Sex", acessos: 4 },
      { day: "Sáb", acessos: 6 },
      { day: "Dom", acessos: 3 },
    ],
    activityHistory: [
      { id: "a1", description: "Ouviu a memória \"Casamento em 1975\"", timestamp: "Hoje às 09:30" },
      { id: "a2", description: "Jogou o Jogo da Memória e acertou 4 de 5 perguntas", timestamp: "Hoje às 09:12" },
      { id: "a3", description: "Visualizou a linha do tempo \"Anos 60\"", timestamp: "Ontem às 18:45" },
      { id: "a4", description: "Reconheceu corretamente Maria em \"Quem é Quem\"", timestamp: "Ontem às 18:30" },
    ],
  },
  "2": {
    memoryGameAccuracy: 62,
    totalGamesPlayed: 18,
    weeklyEngagement: [
      { day: "Seg", acessos: 1 },
      { day: "Ter", acessos: 2 },
      { day: "Qua", acessos: 1 },
      { day: "Qui", acessos: 0 },
      { day: "Sex", acessos: 2 },
      { day: "Sáb", acessos: 1 },
      { day: "Dom", acessos: 2 },
    ],
    activityHistory: [
      { id: "a1", description: "Jogou o Jogo da Memória e acertou 3 de 5 perguntas", timestamp: "Ontem às 18:12" },
      { id: "a2", description: "Ouviu a memória do dia", timestamp: "Ontem às 18:05" },
    ],
  },
  "3": {
    memoryGameAccuracy: 28,
    totalGamesPlayed: 6,
    weeklyEngagement: [
      { day: "Seg", acessos: 0 },
      { day: "Ter", acessos: 0 },
      { day: "Qua", acessos: 1 },
      { day: "Qui", acessos: 0 },
      { day: "Sex", acessos: 0 },
      { day: "Sáb", acessos: 0 },
      { day: "Dom", acessos: 0 },
    ],
    activityHistory: [{ id: "a1", description: "Acessou o Baú de Memórias", timestamp: "3 dias atrás às 14:20" }],
  },
  "4": {
    memoryGameAccuracy: 91,
    totalGamesPlayed: 37,
    weeklyEngagement: [
      { day: "Seg", acessos: 4 },
      { day: "Ter", acessos: 5 },
      { day: "Qua", acessos: 5 },
      { day: "Qui", acessos: 6 },
      { day: "Sex", acessos: 4 },
      { day: "Sáb", acessos: 3 },
      { day: "Dom", acessos: 5 },
    ],
    activityHistory: [
      { id: "a1", description: "Jogou o Jogo da Memória e acertou 5 de 5 perguntas", timestamp: "Hoje às 07:55" },
      { id: "a2", description: "Reconheceu toda a família em \"Quem é Quem\"", timestamp: "Hoje às 07:40" },
    ],
  },
}

export function getPatientReport(patientId: string): PatientReport {
  return (
    patientReports[patientId] ?? {
      memoryGameAccuracy: 0,
      totalGamesPlayed: 0,
      weeklyEngagement: defaultWeeklyEngagement,
      activityHistory: [],
    }
  )
}

export const trueFalseQuestions: TrueFalseQuestion[] = [
  {
    id: "q1",
    question: "Sua primeira profissão foi Marceneiro?",
    correctAnswer: true,
    category: "Profissão",
  },
  {
    id: "q2",
    question: "Sua esposa se chama Maria?",
    correctAnswer: true,
    category: "Família",
  },
  {
    id: "q3",
    question: "Você nasceu em São Paulo?",
    correctAnswer: false,
    category: "Origem",
  },
]
