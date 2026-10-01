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
