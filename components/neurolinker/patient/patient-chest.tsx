"use client"

import { Heart } from "lucide-react"
import type { PatientSummary } from "@/lib/neurolinker-data"
import { MemoryOfDay } from "./memory-of-day"
import { WhoIsWho } from "./who-is-who"
import { LifeTimeline } from "./life-timeline"
import { MemoryGame } from "./memory-game"

export function PatientChest({ patient }: { patient?: PatientSummary }) {
  const firstName = patient?.name?.split(" ")[0] ?? "Seu João"
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#fbf3e7]">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-8">
        <header className="flex items-center gap-4">
          <img
            src={patient?.avatarUrl || "/images/seu-joao-avatar.png"}
            alt={`Foto de ${patient?.name ?? "Seu João"}`}
            className="size-20 rounded-full border-4 border-white object-cover shadow-md"
          />
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <Heart className="size-4 fill-amber-500 text-amber-500" />
              Bom dia
            </p>
            <h1 className="text-3xl font-semibold text-[#2d2a26] sm:text-4xl">Olá, {firstName}!</h1>
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
