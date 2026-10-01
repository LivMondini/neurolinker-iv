"use client"

import { Card } from "@/components/ui/card"
import { History } from "lucide-react"
import { lifeTimeline } from "@/lib/neurolinker-data"

export function LifeTimeline() {
  return (
    <Card className="flex flex-col gap-6 rounded-3xl border-2 border-orange-200 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
          <History className="size-6" />
        </div>
        <h2 className="text-2xl font-semibold text-[#2d2a26]">A Linha da Sua Vida</h2>
      </div>

      <div className="flex flex-col gap-6">
        {lifeTimeline.map((entry, i) => (
          <div key={entry.decade} className="flex gap-4 sm:gap-6">
            <div className="flex flex-col items-center">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                {entry.decade.replace("Anos ", "")}
              </div>
              {i < lifeTimeline.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-orange-200" />}
            </div>
            <div className="flex flex-1 flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:gap-5">
              <img
                src={entry.photoUrl || "/placeholder.svg"}
                alt={entry.title}
                className="h-32 w-full rounded-2xl object-cover sm:h-24 sm:w-36"
              />
              <div>
                <p className="text-lg font-semibold text-[#2d2a26]">{entry.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
