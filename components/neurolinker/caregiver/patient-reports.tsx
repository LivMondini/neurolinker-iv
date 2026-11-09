"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Download, Gamepad2, Clock, FileBarChart } from "lucide-react";
import type { PatientSummary } from "@/lib/neurolinker-data";
import { fetchEventosAtividade, type EventoAtividade } from "@/lib/supabase";

const TZ = "America/Sao_Paulo";
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const chartConfig: ChartConfig = {
  acessos: { label: "Acessos ao Baú", color: "#0284c7" },
};

// "YYYY-MM-DD" no fuso de São Paulo
function chaveDia(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

// Chaves de segunda a domingo da semana atual (fuso de São Paulo)
function chavesSemanaAtual(): string[] {
  const hoje = new Date(chaveDia(new Date()) + "T12:00:00Z");
  const offsetSegunda = (hoje.getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setUTCDate(hoje.getUTCDate() - offsetSegunda + i);
    return d.toISOString().slice(0, 10);
  });
}

function formatarQuando(iso: string): string {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
  const dia = chaveDia(d);
  if (dia === chaveDia(new Date())) return `Hoje às ${hora}`;
  if (dia === chaveDia(new Date(Date.now() - 24 * 60 * 60 * 1000)))
    return `Ontem às ${hora}`;
  return `${d.toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" })} às ${hora}`;
}

function descrever(e: EventoAtividade): string {
  const det = (e.detalhe ?? {}) as { acertos?: number; total?: number };
  switch (e.tipo) {
    case "entrou":
      return "Entrou no aparelho com o PIN";
    case "abriu_baul":
      return "Abriu o Baú de Memórias";
    case "memoria_do_dia":
      return "Viu a Memória do Dia";
    case "jogo":
      return `Jogou o Jogo da Memória e acertou ${det.acertos ?? 0} de ${det.total ?? 0} perguntas`;
    default:
      return "Atividade registrada";
  }
}

export function PatientReports({ patient }: { patient?: PatientSummary }) {
  const [eventos, setEventos] = useState<EventoAtividade[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!patient) return;
    let cancelado = false;
    setEventos(null);
    setErro(false);
    fetchEventosAtividade(patient.id, 30)
      .then((e) => !cancelado && setEventos(e))
      .catch((err) => {
        console.error(err);
        if (!cancelado) setErro(true);
      });
    return () => {
      cancelado = true;
    };
  }, [patient?.id]);

  const resumo = useMemo(() => {
    const lista = eventos ?? [];
    const chaves = chavesSemanaAtual();
    const porDia = new Map(chaves.map((k) => [k, 0]));
    for (const e of lista) {
      if (e.tipo !== "abriu_baul") continue;
      const k = chaveDia(new Date(e.created_at));
      if (porDia.has(k)) porDia.set(k, (porDia.get(k) ?? 0) + 1);
    }
    const semana = chaves.map((k, i) => ({
      day: DIAS[i],
      acessos: porDia.get(k) ?? 0,
    }));

    let acertos = 0;
    let perguntas = 0;
    let partidas = 0;
    for (const e of lista) {
      if (e.tipo !== "jogo") continue;
      const det = (e.detalhe ?? {}) as { acertos?: number; total?: number };
      partidas += 1;
      acertos += det.acertos ?? 0;
      perguntas += det.total ?? 0;
    }

    return {
      semana,
      semanaTemDados: semana.some((s) => s.acessos > 0),
      partidas,
      precisao: perguntas > 0 ? Math.round((acertos / perguntas) * 100) : null,
      historico: lista.slice(0, 10),
    };
  }, [eventos]);

  if (!patient) {
    return (
      <Empty className="rounded-xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileBarChart />
          </EmptyMedia>
          <EmptyTitle>Nenhum paciente selecionado</EmptyTitle>
          <EmptyDescription>
            Selecione um paciente no seletor acima para visualizar seus
            relatórios.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const primeiroNome = patient.name.split(" ")[0];
  const carregando = eventos === null && !erro;
  const semDados = !carregando && !erro && (eventos?.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-6">
      {erro && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Não foi possível carregar a atividade agora. Tente novamente em
          instantes.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                Desempenho no Jogo da Memória
              </CardTitle>
              <CardDescription>
                Acertos e partidas de {primeiroNome} nos últimos 30 dias.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0284c7]/10 text-[#0284c7]">
              <Gamepad2 className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            {carregando ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : resumo.partidas === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda</p>
            ) : (
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-3xl font-semibold text-[#0f172a]">
                    {resumo.precisao}%
                  </p>
                  <p className="text-xs text-muted-foreground">de acertos</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-[#0f172a]">
                    {resumo.partidas}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    partidas jogadas
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Engajamento Semanal</CardTitle>
              <CardDescription>
                Acessos ao Baú de Memórias nesta semana (seg a dom).
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0284c7]/10 text-[#0284c7]">
              <Clock className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            {carregando ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : !resumo.semanaTemDados ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-36 w-full">
                <BarChart data={resumo.semana}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="acessos"
                    fill="var(--color-acessos)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Histórico de Atividades</CardTitle>
            <CardDescription>
              Últimas interações de {primeiroNome} no Baú de Memórias.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => window.print()}
            disabled={carregando || semDados}
          >
            <Download data-icon="inline-start" />
            Exportar Relatório em PDF
          </Button>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : resumo.historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há atividades registradas para este paciente.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {resumo.historico.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
                >
                  <p className="text-sm text-foreground">{descrever(e)}</p>
                  <Badge variant="secondary" className="shrink-0">
                    {formatarQuando(e.created_at)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
