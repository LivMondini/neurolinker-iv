"use client"

import { Heart } from "lucide-react"
import type { PatientSummary } from "@/lib/neurolinker-data"
import { MemoryOfDay } from "./memory-of-day"
import { WhoIsWho } from "./who-is-who"
import { LifeTimeline } from "./life-timeline"
import { MemoryGame } from "./memory-game"

export function PatientChest({ patients, activePatient, onSelectPatient }: { patients: PatientSummary[]; activePatient?: PatientSummary; onSelectPatient: (id: string) => void }) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#fbf3e7]">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-8">
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Visualizando Baú do Paciente</p><p className="text-sm text-[#2d2a26]">Teste como cada pessoa enxerga suas memórias</p></div>
          <select aria-label="Paciente do baú" value={activePatient?.id ?? ""} onChange={(event) => onSelectPatient(event.target.value)} className="h-10 rounded-lg border border-amber-200 bg-white px-3 text-sm font-medium text-[#2d2a26] outline-none focus:ring-2 focus:ring-amber-400/40">{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} - {patient.age} anos</option>)}</select>
        </div>
        <header className="flex items-center gap-4">
          <img
            src="/images/seu-joao-avatar.png"
            alt="Foto de Seu João"
            className="size-20 rounded-full border-4 border-white object-cover shadow-md"
          />
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <Heart className="size-4 fill-amber-500 text-amber-500" />
              Bom dia
            </p>
            <h1 className="text-3xl font-semibold text-[#2d2a26] sm:text-4xl">Olá, Seu João!</h1>
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
