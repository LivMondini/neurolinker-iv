"use client"

import { useState } from "react"
import { CaregiverSidebar, type CaregiverSection } from "./caregiver-sidebar"
import { PatientsTable } from "./patients-table"
import { MemoryManager } from "./memory-manager"
import { QuestionManager } from "./question-manager"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Users, Activity, Image as ImageIcon, TrendingUp, FileBarChart } from "lucide-react"
import { patients } from "@/lib/neurolinker-data"

const stats = [
  { label: "Pacientes ativos", value: patients.filter((p) => p.status === "Ativo").length, icon: Users },
  {
    label: "Engajamento médio",
    value: `${Math.round(patients.reduce((acc, p) => acc + p.engagementScore, 0) / patients.length)}%`,
    icon: Activity,
  },
  { label: "Memórias cadastradas", value: 24, icon: ImageIcon },
  { label: "Progresso semanal", value: "+12%", icon: TrendingUp },
]

export function CaregiverDashboard() {
  const [section, setSection] = useState<CaregiverSection>("patients")

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col lg:flex-row">
      <CaregiverSidebar active={section} onChange={setSection} />
      <main className="flex-1 bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">
              {section === "patients" && "Visão geral dos pacientes"}
              {section === "memories" && "Memórias"}
              {section === "games" && "Jogos Cognitivos"}
              {section === "reports" && "Relatórios"}
            </h1>
            <p className="text-muted-foreground">
              {section === "patients" && "Monitore o progresso terapêutico de cada paciente em tempo real."}
              {section === "memories" && "Cadastre e organize o acervo de memórias de cada paciente."}
              {section === "games" && "Configure as perguntas usadas no Jogo da Memória do paciente."}
              {section === "reports" && "Relatórios detalhados de uso e evolução cognitiva."}
            </p>
          </div>

          {section === "patients" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#0284c7]/10 text-[#0284c7]">
                        <stat.icon className="size-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold leading-tight text-[#0f172a]">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <PatientsTable />
            </>
          )}

          {section === "memories" && <MemoryManager />}

          {section === "games" && <QuestionManager />}

          {section === "reports" && (
            <Empty className="rounded-xl border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileBarChart />
                </EmptyMedia>
                <EmptyTitle>Relatórios em construção</EmptyTitle>
                <EmptyDescription>
                  Relatórios detalhados de evolução cognitiva estarão disponíveis em breve nesta área.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </main>
    </div>
  )
}
