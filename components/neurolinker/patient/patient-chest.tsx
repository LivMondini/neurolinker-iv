"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import type { PatientSummary } from "@/lib/neurolinker-data";
import {
  type BaulData,
  fetchMemorias,
  fetchPerguntasJogo,
  obterUrlAssinada,
} from "@/lib/supabase";
import { MemoryOfDay } from "./memory-of-day";
import { WhoIsWho } from "./who-is-who";
import { LifeTimeline } from "./life-timeline";
import { MemoryGame } from "./memory-game";

type Memoria = BaulData["memorias"][number];
type Pergunta = BaulData["perguntas"][number];

function escolherMemoriaDoDia(memorias: Memoria[]): Memoria | null {
  if (memorias.length === 0) return null;
  const dia = Math.floor(Date.now() / 86_400_000);
  return memorias[dia % memorias.length];
}

// `patient`: preview do cuidador (sem PIN). `baul`: acesso real do paciente.
export function PatientChest({
  patient,
  baul,
}: {
  patient?: PatientSummary;
  baul?: BaulData;
}) {
  const [preview, setPreview] = useState<{
    memorias: Memoria[];
    perguntas: Pergunta[];
  } | null>(null);

  // Preview do cuidador: busca dados reais; se falhar (ex.: paciente de mock), mantém o mock.
  useEffect(() => {
    if (baul || !patient?.id) {
      setPreview(null);
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        const [mems, pergs] = await Promise.all([
          fetchMemorias(patient.id),
          fetchPerguntasJogo(patient.id),
        ]);
        const memorias: Memoria[] = await Promise.all(
          (mems as Memoria[]).map(async (m) => {
            if (!m.media_path) return m;
            try {
              return { ...m, url: await obterUrlAssinada(m.media_path) };
            } catch {
              return m;
            }
          }),
        );
        if (!cancelado)
          setPreview({ memorias, perguntas: pergs as Pergunta[] });
      } catch {
        if (!cancelado) setPreview(null);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [baul, patient?.id]);

  const dados = baul ?? preview;
  const modoReal = !!dados;

  const nome = baul?.paciente.name ?? patient?.name;
  const firstName = nome?.split(" ")[0] ?? "Seu João";
  const avatarUrl =
    baul?.paciente.avatar_url ||
    patient?.avatarUrl ||
    "/images/seu-joao-avatar.png";

  const memoriaDoDia = dados ? escolherMemoriaDoDia(dados.memorias) : null;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-8">
        <header className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={`Foto de ${nome ?? "Seu João"}`}
            className="size-20 rounded-full border-4 border-white object-cover shadow-md"
          />
          <div>
            <p className="flex items-center gap-2 text-base font-semibold text-slate-700">
              <Heart className="size-4 fill-amber-500 text-amber-500" />
              Bom dia
            </p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Olá, {firstName}!
            </h1>
          </div>
        </header>

        {modoReal ? (
          memoriaDoDia && (
            <MemoryOfDay
              fotoUrl={memoriaDoDia.type === "photo" ? memoriaDoDia.url : null}
              fotoLabel={memoriaDoDia.label}
              audioUrl={memoriaDoDia.type === "audio" ? memoriaDoDia.url : null}
              relato={memoriaDoDia.content || memoriaDoDia.label}
            />
          )
        ) : (
          <MemoryOfDay />
        )}

        {/* Sem tabelas no banco: só aparecem no preview com mock */}
        {!modoReal && <WhoIsWho />}
        {!modoReal && <LifeTimeline />}

        <MemoryGame
          perguntas={
            dados
              ? dados.perguntas.map((p) => ({
                  id: p.id,
                  question: p.question,
                  correctAnswer: p.correct_answer,
                  category: p.category,
                }))
              : undefined
          }
        />
      </div>
    </div>
  );
}
