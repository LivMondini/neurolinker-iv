"use client"

import { useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function MemoryOfDay() {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr]">
        <div className="relative aspect-square sm:aspect-auto">
          <img
            src="/images/memoria-historica.png"
            alt="Foto de casamento antiga em tom sépia"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-blue-700">
            <Sparkles className="size-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Memória do Dia</span>
          </div>
          <p className="text-xl font-medium leading-relaxed text-slate-800 sm:text-2xl">
            Este é o dia do seu casamento com Maria, em 1975. Vocês escolheram uma pequena capela perto da casa dos
            seus pais para celebrar esse momento especial.
          </p>
          <audio ref={audioRef} src="/audio/memoria-do-dia.mp3" preload="none" onEnded={() => setPlaying(false)} className="sr-only" />
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={() => { if (playing) audioRef.current?.pause(); else void audioRef.current?.play(); setPlaying((p) => !p) }}
              className="h-14 gap-2 rounded-xl bg-blue-600 px-6 text-base font-semibold text-white hover:bg-blue-700"
            >
              {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
              {playing ? "Pausar áudio" : "Ouvir essa história"}
            </Button>
            <div className="flex h-8 items-end gap-0.5">
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "w-1 rounded-full bg-blue-400 transition-all",
                    playing ? "animate-pulse" : "opacity-40",
                  )}
                  style={{
                    height: `${((i % 5) + 2) * 5}px`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
