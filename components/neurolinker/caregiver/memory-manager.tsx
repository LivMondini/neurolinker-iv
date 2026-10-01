"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImagePlus, Mic, FileText, Image as ImageIcon } from "lucide-react"
import type { PatientSummary } from "@/lib/neurolinker-data"

const mediaItems = [
  { type: "photo", label: "Casamento - 1975", src: "/images/timeline-1970.png" },
  { type: "photo", label: "Oficina de marcenaria", src: "/images/timeline-1960.png" },
  { type: "photo", label: "Aniversário em família", src: "/images/timeline-1980.png" },
]

export function MemoryManager({ patient }: { patient?: PatientSummary }) {
  // Para integrar com Supabase: substitua `mediaItems` pelo resultado de
  // `fetchMemorias(patient.id)` e use `uploadMemoria(dados)` nos botões de envio acima
  // (ver lib/supabase.ts).
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciador de Memórias</CardTitle>
        <CardDescription>
          Cadastrando memórias para: <strong className="text-foreground">{patient?.name ?? "Nenhum paciente selecionado"}</strong>. Central de mídia para fotos de família, trechos de áudio e relatos de vida.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button variant="outline" className="h-24 flex-col gap-2 bg-[#0284c7]/5 hover:bg-[#0284c7]/10">
            <ImagePlus className="size-5 text-[#0284c7]" data-icon="inline-start" />
            Enviar foto
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 bg-[#0284c7]/5 hover:bg-[#0284c7]/10">
            <Mic className="size-5 text-[#0284c7]" data-icon="inline-start" />
            Gravar áudio
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 bg-[#0284c7]/5 hover:bg-[#0284c7]/10">
            <FileText className="size-5 text-[#0284c7]" data-icon="inline-start" />
            Escrever relato
          </Button>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">Mídias cadastradas</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {mediaItems.map((item) => (
              <div
                key={item.label}
                className="group relative overflow-hidden rounded-xl border border-border"
              >
                <img
                  src={item.src || "/placeholder.svg"}
                  alt={item.label}
                  className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="flex items-center gap-2 bg-card p-2.5">
                  <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs font-medium">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
