"use client"

import { Heart } from "lucide-react"
import type { PatientSummary } from "@/lib/neurolinker-data"
import type { BaulData } from "@/lib/supabase"
import { MemoryOfDay } from "./memory-of-day"
import { WhoIsWho } from "./who-is-who"
import { LifeTimeline } from "./life-timeline"
import { MemoryGame } from "./memory-game"

// `patient`: usado no modo "preview do cuidador" (botão Acessar conta, sem PIN).
// `baul`: usado no acesso real do paciente (depois do PIN), com dados vindos do banco.
// TODO: MemoryOfDay, WhoIsWho, LifeTimeline e MemoryGame ainda usam dados mockados
// internamente. Quando baul.memorias/baul.perguntas estiverem prontos para uso,
// eles precisam receber esses dados em vez de buscar sozinhos.
export function PatientChest({ patient, baul }: { patient?: PatientSummary; baul?: BaulData }) {
  const nome = baul?.paciente.name ?? patient?.name
  const firstName = nome?.split(" ")[0] ?? "Seu João"
  const avatarUrl = baul?.paciente.avatar_url || patient?.avatarUrl || "/images/seu-joao-avatar.png"

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
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Olá, {firstName}!</h1>
          </div>
        </header>

        <MemoryOfDay />
        <WhoIsWho />
        <LifeTimeline />
        <MemoryGame />
      </div>
    </div>
  )
}