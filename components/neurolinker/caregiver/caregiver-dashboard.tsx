"use client"

import { useState } from "react"
import { CaregiverSidebar, type CaregiverSection } from "./caregiver-sidebar"
import { PatientsTable } from "./patients-table"
import { MemoryManager } from "./memory-manager"
import { QuestionManager } from "./question-manager"
import { PatientReports } from "./patient-reports"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Activity, Image as ImageIcon, TrendingUp } from "lucide-react"
import type { PatientSummary } from "@/lib/neurolinker-data"

interface Props { patients: PatientSummary[]; activePatient?: PatientSummary; onSelectPatient: (id: string) => void; onAddPatient: (patient: PatientSummary) => void }

export function CaregiverDashboard({ patients, activePatient, onSelectPatient, onAddPatient }: Props) {
  const [section, setSection] = useState<CaregiverSection>("patients")
  const active = activePatient ?? patients[0]
  const stats = [
    { label: "Pacientes ativos", value: patients.filter((p) => p.status === "Ativo").length, icon: Users },
    { label: "Engajamento médio", value: `${patients.length ? Math.round(patients.reduce((acc, p) => acc + p.engagementScore, 0) / patients.length) : 0}%`, icon: Activity },
    { label: "Memórias cadastradas", value: 24, icon: ImageIcon },
    { label: "Progresso semanal", value: "+12%", icon: TrendingUp },
  ]
  return <div className="flex min-h-[calc(100vh-56px)] flex-col lg:flex-row">
    <CaregiverSidebar active={section} onChange={setSection} />
    <main className="flex-1 bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">{section === "patients" ? "Visão geral dos pacientes" : section === "memories" ? "Memórias" : section === "games" ? "Jogos Cognitivos" : "Relatórios"}</h1><p className="text-muted-foreground">{section === "patients" ? "Monitore o progresso terapêutico de cada paciente em tempo real." : section === "memories" ? "Cadastre e organize o acervo de memórias de cada paciente." : section === "games" ? "Configure as perguntas usadas no Jogo da Memória do paciente." : "Relatórios detalhados de uso e evolução cognitiva."}</p></div>
          <label className="flex min-w-64 flex-col gap-1.5 text-xs font-semibold text-slate-600">Gerenciando paciente<select aria-label="Paciente ativo" value={active?.id ?? ""} onChange={(event) => onSelectPatient(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30">{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} - {patient.age} anos</option>)}</select></label>
        </div>
        {section === "patients" && <><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map((stat) => <Card key={stat.label}><CardContent className="flex items-center gap-4 p-5"><div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#0284c7]/10 text-[#0284c7]"><stat.icon className="size-5" /></div><div><p className="text-2xl font-semibold leading-tight text-[#0f172a]">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div></CardContent></Card>)}</div><PatientsTable patients={patients} activePatientId={active?.id} onSelectPatient={onSelectPatient} onAddPatient={onAddPatient} /></>}
        {section === "memories" && <MemoryManager patient={active} />}
        {section === "games" && <QuestionManager patient={active} />}
        {section === "reports" && <PatientReports patient={active} />}
      </div>
    </main>
  </div>
}
