"use client";

import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, Mic, FileText, Image as ImageIcon } from "lucide-react";
import type { PatientSummary } from "@/lib/neurolinker-data";

const mediaItems = [
  {
    type: "photo",
    label: "Casamento - 1975",
    src: "/images/timeline-1970.png",
  },
  {
    type: "photo",
    label: "Oficina de marcenaria",
    src: "/images/timeline-1960.png",
  },
  {
    type: "photo",
    label: "Aniversário em família",
    src: "/images/timeline-1980.png",
  },
];

export function MemoryManager({ patient }: { patient?: PatientSummary }) {
  // useRef: referências aos inputs de arquivo escondidos
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // useState: guarda o arquivo que a pessoa escolheu, para mostrar na tela
  const [fotoEscolhida, setFotoEscolhida] = useState<File | null>(null);
  const [audioEscolhido, setAudioEscolhido] = useState<File | null>(null);

  // Limpa o input (via ref) e o estado
  function removerFoto() {
    if (photoInputRef.current) photoInputRef.current.value = "";
    setFotoEscolhida(null);
  }

  function removerAudio() {
    if (audioInputRef.current) audioInputRef.current.value = "";
    setAudioEscolhido(null);
  }

  // Para integrar com Supabase: substitua `mediaItems` pelo resultado de
  // `fetchMemorias(patient.id)` e use `uploadMemoria(dados)` nos botões de envio
  // (ver lib/supabase.ts).
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciador de Memórias</CardTitle>
        <CardDescription>
          Cadastrando memórias para:{" "}
          <strong className="text-foreground">
            {patient?.name ?? "Nenhum paciente selecionado"}
          </strong>
          . Central de mídia para fotos de família, trechos de áudio e relatos
          de vida.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Inputs escondidos: o botão bonito chama .click() neles via ref */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Selecionar foto"
          onChange={(e) => setFotoEscolhida(e.target.files?.[0] ?? null)}
        />
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          className="sr-only"
          aria-label="Selecionar áudio"
          onChange={(e) => setAudioEscolhido(e.target.files?.[0] ?? null)}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button
            onClick={() => photoInputRef.current?.click()}
            variant="outline"
            className="h-24 flex-col gap-2 bg-[#0284c7]/5 hover:bg-[#0284c7]/10"
          >
            <ImagePlus
              className="size-5 text-[#0284c7]"
              data-icon="inline-start"
            />
            Enviar foto
          </Button>
          <Button
            onClick={() => audioInputRef.current?.click()}
            variant="outline"
            className="h-24 flex-col gap-2 bg-[#0284c7]/5 hover:bg-[#0284c7]/10"
          >
            <Mic className="size-5 text-[#0284c7]" data-icon="inline-start" />
            Gravar áudio
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2 bg-[#0284c7]/5 hover:bg-[#0284c7]/10"
          >
            <FileText
              className="size-5 text-[#0284c7]"
              data-icon="inline-start"
            />
            Escrever relato
          </Button>
        </div>

        {/* Arquivos escolhidos, com botão para remover */}
        {(fotoEscolhida || audioEscolhido) && (
          <div className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm">
            {fotoEscolhida && (
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">Foto: {fotoEscolhida.name}</span>
                <Button size="sm" variant="ghost" onClick={removerFoto}>
                  Remover
                </Button>
              </div>
            )}
            {audioEscolhido && (
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">Áudio: {audioEscolhido.name}</span>
                <Button size="sm" variant="ghost" onClick={removerAudio}>
                  Remover
                </Button>
              </div>
            )}
          </div>
        )}

        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">
            Mídias cadastradas
          </h4>
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
                  <span className="truncate text-xs font-medium">
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
