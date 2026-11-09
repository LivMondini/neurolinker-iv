"use client";

import { useEffect, useState } from "react";
import { CaregiverSidebar, type CaregiverSection } from "./caregiver-sidebar";
import { PatientsTable } from "./patients-table";
import { MemoryManager } from "./memory-manager";
import { QuestionManager } from "./question-manager";
import { PatientReports } from "./patient-reports";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Activity, Image as ImageIcon, HelpCircle } from "lucide-react";
import type { PatientSummary } from "@/lib/neurolinker-data";
import {
  contarMemorias,
  contarPerguntasJogo,
  fetchResumoAtividade,
  type ResumoAtividade,
} from "@/lib/supabase";

interface Props {
  patients: PatientSummary[];
  activePatient?: PatientSummary;
  onSelectPatient: (id: string) => void;
  onAddPatient: (patient: PatientSummary) => void;
  onAccessPatient: (id: string) => void;
  onDeletePatient: (id: string) => void;
}

const TITLES: Record<CaregiverSection, { title: string; subtitle: string }> = {
  patients: {
    title: "Visão geral dos pacientes",
    subtitle:
      "Monitore o progresso terapêutico de cada paciente em tempo real.",
  },
  memories: {
    title: "Memórias",
    subtitle: "Cadastre e organize o acervo de memórias de cada paciente.",
  },
  games: {
    title: "Jogos Cognitivos",
    subtitle: "Configure as perguntas usadas no Jogo da Memória do paciente.",
  },
  reports: {
    title: "Relatórios",
    subtitle: "Relatórios detalhados de uso e evolução cognitiva.",
  },
};

export function CaregiverDashboard({
  patients,
  activePatient,
  onSelectPatient,
  onAddPatient,
  onAccessPatient,
  onDeletePatient,
}: Props) {
  const [section, setSection] = useState<CaregiverSection>("patients");
  const [totalMemorias, setTotalMemorias] = useState<number | null>(null);
  const [totalPerguntas, setTotalPerguntas] = useState<number | null>(null);
  const active = activePatient ?? patients[0];
  const [atividade, setAtividade] = useState<
    Record<string, ResumoAtividade> | undefined
  >(undefined);

  // Recarrega os totais ao voltar para a visão geral (depois de cadastrar memórias/perguntas
  // nas outras abas) e quando a lista de pacientes muda.
  useEffect(() => {
    if (section !== "patients") return;
    let cancelado = false;
    Promise.all([contarMemorias(), contarPerguntasJogo()])
      .then(([m, p]) => {
        if (cancelado) return;
        setTotalMemorias(m);
        setTotalPerguntas(p);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelado) {
          setTotalMemorias(null);
          setTotalPerguntas(null);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [section, patients.length]);
  useEffect(() => {
    if (section !== "patients") return;
    let cancelado = false;
    fetchResumoAtividade()
      .then((r) => !cancelado && setAtividade(r))
      .catch((err) => {
        console.error(err);
        if (!cancelado) setAtividade({});
      });
    return () => {
      cancelado = true;
    };
  }, [section, patients.length]);
  const scores = patients
    .map((p) => atividade?.[p.id]?.score)
    .filter((s): s is number => typeof s === "number");
  const engajamentoMedio = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;
  const stats = [
    {
      label: "Pacientes ativos",
      value: patients.filter((p) => p.status === "Ativo").length,
      icon: Users,
    },
    {
      label: "Engajamento médio",
      value: engajamentoMedio === null ? "—" : `${engajamentoMedio}%`,
      icon: Activity,
    },
    {
      label: "Memórias cadastradas",
      value: totalMemorias ?? "—",
      icon: ImageIcon,
    },
    {
      label: "Perguntas do jogo",
      value: totalPerguntas ?? "—",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col lg:flex-row">
      <CaregiverSidebar active={section} onChange={setSection} />
      <main className="flex-1 bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">
                {TITLES[section].title}
              </h1>
              <p className="text-muted-foreground">
                {TITLES[section].subtitle}
              </p>
            </div>
            <label className="flex min-w-64 flex-col gap-1.5 text-xs font-semibold text-slate-600">
              Gerenciando paciente
              <select
                aria-label="Paciente ativo"
                value={active?.id ?? ""}
                onChange={(event) => onSelectPatient(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30"
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} - {patient.age} anos
                  </option>
                ))}
              </select>
            </label>
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
                        <p className="text-2xl font-semibold leading-tight text-[#0f172a]">
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <PatientsTable
                {...({
                  atividade,
                  patients,
                  activePatientId: active?.id,
                  onSelectPatient,
                  onAddPatient,
                  onAccessPatient,
                  onDeletePatient,
                } as any)}
              />
            </>
          )}
          {section === "memories" && <MemoryManager patient={active} />}
          {section === "games" && <QuestionManager patient={active} />}
          {section === "reports" && <PatientReports patient={active} />}
        </div>
      </main>
    </div>
  );
}
