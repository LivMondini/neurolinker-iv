"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Mic, FileText, Image as ImageIcon } from "lucide-react";
import type { PatientSummary } from "@/lib/neurolinker-data";
import {
  fetchMemorias,
  uploadMemoria,
  uploadArquivoMemoria,
  obterUrlAssinada,
} from "@/lib/supabase";

type Memoria = {
  id: string;
  type: "photo" | "audio" | "text";
  label: string;
  media_path: string | null;
  content: string | null;
  url?: string;
};

export function MemoryManager({ patient }: { patient?: PatientSummary }) {
  // useRef: acesso aos inputs de arquivo escondidos
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [fotoEscolhida, setFotoEscolhida] = useState<File | null>(null);
  const [audioEscolhido, setAudioEscolhido] = useState<File | null>(null);
  const [mostrarRelato, setMostrarRelato] = useState(false);
  const [relato, setRelato] = useState("");
  const [titulo, setTitulo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [memorias, setMemorias] = useState<Memoria[]>([]);

  async function carregarMemorias() {
    if (!patient?.id) {
      setMemorias([]);
      return;
    }
    try {
      const dados = (await fetchMemorias(patient.id)) as Memoria[];
      // Converte media_path em URL temporária para poder exibir
      const comUrl = await Promise.all(
        dados.map(async (m) => {
          if (!m.media_path) return m;
          try {
            return { ...m, url: await obterUrlAssinada(m.media_path) };
          } catch {
            return m;
          }
        }),
      );
      setMemorias(comUrl);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar memórias.");
    }
  }

  useEffect(() => {
    carregarMemorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  function removerFoto() {
    if (photoInputRef.current) photoInputRef.current.value = "";
    setFotoEscolhida(null);
  }

  function removerAudio() {
    if (audioInputRef.current) audioInputRef.current.value = "";
    setAudioEscolhido(null);
  }

  async function salvar() {
    if (!patient?.id) return setErro("Selecione um paciente primeiro.");
    if (!titulo.trim()) return setErro("Dê um título para a memória.");
    if (!fotoEscolhida && !audioEscolhido && !relato.trim()) {
      return setErro("Escolha uma foto, um áudio ou escreva um relato.");
    }

    setSalvando(true);
    setErro("");
    try {
      if (fotoEscolhida) {
        const path = await uploadArquivoMemoria(patient.id, fotoEscolhida);
        await uploadMemoria({
          pacienteId: patient.id,
          type: "photo",
          label: titulo.trim(),
          mediaPath: path,
        });
      }
      if (audioEscolhido) {
        const path = await uploadArquivoMemoria(patient.id, audioEscolhido);
        await uploadMemoria({
          pacienteId: patient.id,
          type: "audio",
          label: titulo.trim(),
          mediaPath: path,
        });
      }
      if (relato.trim()) {
        await uploadMemoria({
          pacienteId: patient.id,
          type: "text",
          label: titulo.trim(),
          content: relato.trim(),
        });
      }

      removerFoto();
      removerAudio();
      setRelato("");
      setTitulo("");
      setMostrarRelato(false);
      await carregarMemorias();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar a memória.");
    } finally {
      setSalvando(false);
    }
  }

  const temAlgoParaSalvar = !!(
    fotoEscolhida ||
    audioEscolhido ||
    relato.trim()
  );

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
            Enviar áudio
          </Button>
          <Button
            onClick={() => setMostrarRelato((v) => !v)}
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

        {mostrarRelato && (
          <textarea
            value={relato}
            onChange={(e) => setRelato(e.target.value)}
            placeholder="Escreva o relato de vida aqui..."
            rows={4}
            className="w-full rounded-lg border border-border bg-background p-3 text-sm"
          />
        )}

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

        {temAlgoParaSalvar && (
          <div className="flex flex-col gap-3">
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título da memória (ex.: Casamento - 1975)"
            />
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar memória"}
            </Button>
          </div>
        )}

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">
            Mídias cadastradas
          </h4>
          {memorias.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma memória cadastrada ainda.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {memorias.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-border"
                >
                  {item.type === "photo" && item.url && (
                    <img
                      src={item.url}
                      alt={item.label}
                      className="h-32 w-full object-cover"
                    />
                  )}
                  {item.type === "audio" && item.url && (
                    <audio controls src={item.url} className="w-full" />
                  )}
                  {item.type === "text" && (
                    <p className="line-clamp-4 p-3 text-xs">{item.content}</p>
                  )}
                  <div className="flex items-center gap-2 bg-card p-2.5">
                    <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs font-medium">
                      {item.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
