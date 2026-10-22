"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, Images } from "lucide-react";
import { Card } from "@/components/ui/card";
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

type Memoria = BaulData["memorias"][number] & {
  url?: string | null;
  ano?: number | null;
};
type Pergunta = BaulData["perguntas"][number];

// Memória do dia: só foto ou relato (áudio foi removido do app).
// Muda a cada dia, mas fica estável durante o mesmo dia.
function escolherMemoriaDoDia(memorias: Memoria[]): Memoria | null {
  const validas = memorias.filter((m) => m.type !== "audio");
  if (validas.length === 0) return null;
  const dia = Math.floor(Date.now() / 86_400_000);
  return validas[dia % validas.length];
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// `patient`: preview do cuidador (sem PIN). `baul`: acesso real do paciente.
export function PatientChest({
  patient,
  baul,
  onBack,
}: {
  patient?: PatientSummary;
  baul?: BaulData;
  onBack?: () => void; // só passe no preview do cuidador
}) {
  const [preview, setPreview] = useState<{
    memorias: Memoria[];
    perguntas: Pergunta[];
  } | null>(null);

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

  const dados = (baul ?? preview) as {
    memorias: Memoria[];
    perguntas: Pergunta[];
  } | null;
  const modoReal = !!dados;

  const nome = baul?.paciente.name ?? patient?.name;
  const firstName = nome?.split(" ")[0] ?? "Seu João";
  const avatarUrl =
    baul?.paciente.avatar_url ||
    patient?.avatarUrl ||
    "/images/seu-joao-avatar.png";

  const memoriaDoDia = useMemo(
    () => (dados ? escolherMemoriaDoDia(dados.memorias) : null),
    [dados],
  );
  const fotos = useMemo(
    () => (dados?.memorias ?? []).filter((m) => m.type === "photo" && m.url),
    [dados],
  );

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex w-fit items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
          >
            <ArrowLeft className="size-5" />
            Voltar ao painel do cuidador
          </button>
        )}

        <header className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={`Foto de ${nome ?? "Seu João"}`}
            className="size-20 rounded-full border-4 border-white object-cover shadow-md sm:size-24"
          />
          <div>
            <p className="flex items-center gap-2 text-lg font-semibold text-slate-700">
              <Heart className="size-5 fill-amber-500 text-amber-500" />
              {saudacao()}
            </p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Olá, {firstName}!
            </h1>
          </div>
        </header>

        {modoReal ? (
          memoriaDoDia ? (
            <MemoryOfDay
              fotoUrl={
                memoriaDoDia.type === "photo"
                  ? (memoriaDoDia.url ?? null)
                  : null
              }
              fotoLabel={memoriaDoDia.label}
              ano={memoriaDoDia.ano ?? null}
              relato={memoriaDoDia.content || memoriaDoDia.label}
            />
          ) : (
            <Card className="rounded-2xl border border-slate-200 bg-white p-6 text-lg text-slate-600 shadow-md">
              Ainda não há lembranças por aqui. Quando alguém adicionar fotos ou
              histórias, elas aparecem neste lugar.
            </Card>
          )
        ) : (
          <MemoryOfDay />
        )}

        {/* Linha do tempo: só com memórias reais que têm ano */}
        {modoReal && <LifeTimeline memorias={dados!.memorias} />}

        {/* Álbum de fotos */}
        {modoReal && fotos.length > 0 && (
          <Card className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Images className="size-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Meu Álbum</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fotos.map((f) => (
                <figure key={f.id} className="flex flex-col gap-1">
                  <img
                    src={f.url as string}
                    alt={f.label}
                    loading="lazy"
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                  <figcaption className="text-base font-medium text-slate-800">
                    {f.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Card>
        )}

        {/* Sem tabela no banco ainda: só aparece no preview com mock */}
        {!modoReal && <WhoIsWho />}

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
