"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Download, Gamepad2, Clock, FileBarChart } from "lucide-react"
import { getPatientReport, type PatientSummary } from "@/lib/neurolinker-data"

const chartConfig: ChartConfig = {
  acessos: { label: "Acessos ao Baú", color: "#0284c7" },
}

export function PatientReports({ patient }: { patient?: PatientSummary }) {
  // Para integrar com Supabase: substitua `getPatientReport(patient.id)` por dados agregados
  // vindos de tabelas de partidas e acessos (ver lib/supabase.ts e comentário em
  // lib/neurolinker-data.ts).
  if (!patient) {
    return (
      <Empty className="rounded-xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileBarChart />
          </EmptyMedia>
          <EmptyTitle>Nenhum paciente selecionado</EmptyTitle>
          <EmptyDescription>Selecione um paciente no seletor acima para visualizar seus relatórios.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const report = getPatientReport(patient.id)

  function handleExport() {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Desempenho no Jogo da Memória</CardTitle>
              <CardDescription>Porcentagem de acertos e partidas jogadas por {patient.name.split(" ")[0]}.</CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0284c7]/10 text-[#0284c7]">
              <Gamepad2 className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="flex items-end gap-6">
            <div>
              <p className="text-3xl font-semibold text-[#0f172a]">{report.memoryGameAccuracy}%</p>
              <p className="text-xs text-muted-foreground">de acertos</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-[#0f172a]">{report.totalGamesPlayed}</p>
              <p className="text-xs text-muted-foreground">partidas jogadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Engajamento Semanal</CardTitle>
              <CardDescription>Frequência de acesso ao Baú de Memórias.</CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0284c7]/10 text-[#0284c7]">
              <Clock className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-36 w-full">
              <BarChart data={report.weeklyEngagement}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="acessos" fill="var(--color-acessos)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Histórico de Atividades</CardTitle>
            <CardDescription>Últimas interações de {patient.name.split(" ")[0]} no Baú de Memórias.</CardDescription>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download data-icon="inline-start" />
            Exportar Relatório em PDF
          </Button>
        </CardHeader>
        <CardContent>
          {report.activityHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há atividades registradas para este paciente.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {report.activityHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <p className="text-sm text-foreground">{entry.description}</p>
                  <Badge variant="secondary" className="shrink-0">
                    {entry.timestamp}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
