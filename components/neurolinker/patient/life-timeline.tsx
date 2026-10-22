"use client";

import { Card } from "@/components/ui/card";
import { History } from "lucide-react";

export interface TimelineMemoria {
  id: string;
  type: string;
  label: string;
  content?: string | null;
  url?: string | null;
  ano?: number | null;
}

// Mostra só memórias que têm ano, em ordem do mais antigo ao mais recente.
export function LifeTimeline({ memorias }: { memorias: TimelineMemoria[] }) {
  const itens = memorias
    .filter((m) => typeof m.ano === "number" && m.type !== "audio")
    .sort((a, b) => (a.ano as number) - (b.ano as number));

  return (
    <Card className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          <History className="size-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          A Linha da Sua Vida
        </h2>
      </div>

      {itens.length === 0 ? (
        <p className="text-lg leading-relaxed text-slate-600">
          Ainda não há lembranças com data. Peça para quem cuida de você
          adicionar o ano de cada memória.
        </p>
      ) : (
        <ol className="flex flex-col">
          {itens.map((m, i) => (
            <li key={m.id} className="flex gap-4 sm:gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-base font-bold text-blue-900">
                  {m.ano}
                </div>
                {i < itens.length - 1 && (
                  <div className="mt-1 w-0.5 flex-1 bg-slate-300" />
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 pb-8 sm:flex-row sm:items-start sm:gap-5">
                {m.type === "photo" && m.url && (
                  <img
                    src={m.url}
                    alt={m.label}
                    loading="lazy"
                    className="h-40 w-full rounded-2xl object-cover sm:h-28 sm:w-40"
                  />
                )}
                <div>
                  <p className="text-xl font-bold text-slate-900">{m.label}</p>
                  {m.content && (
                    <p className="mt-1 text-lg leading-relaxed text-slate-700">
                      {m.content}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
