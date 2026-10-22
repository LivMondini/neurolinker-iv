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
import { ImagePlus, Loader2, X, CheckCircle2 } from "lucide-react";
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
  ano?: number | null;
  url?: string;
};

const ANO_ATUAL = new Date().getFullYear();

// Erros do Supabase são objetos simples (não "Error"), então lemos o .message
function mensagemErro(e: unknown, padrao: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e)
    return String((e as { message: unknown }).message);
  return padrao;
}

export function MemoryManager({ patient }: { patient?: PatientSummary }) {
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [ano, setAno] = useState("");
  // "baul": só álbum e Memória do Dia | "linha": também entra na Linha da Vida (com ano)
  const [destino, setDestino] = useState<"baul" | "linha">("baul");
  const [relato, setRelato] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [memorias, setMemorias] = useState<Memoria[]>([]);

  // Pré-visualização da foto escolhida
  useEffect(() => {
    if (!foto) {
      setFotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setFotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  async function carregarMemorias() {
    if (!patient?.id) {
      setMemorias([]);
      return;
    }
    try {
      const dados = (await fetchMemorias(patient.id)) as Memoria[];
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
      console.error("Erro ao carregar memórias:", e);
      setErro(mensagemErro(e, "Erro ao carregar memórias."));
    }
  }

  useEffect(() => {
    carregarMemorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  function removerFoto() {
    if (photoInputRef.current) photoInputRef.current.value = "";
    setFoto(null);
  }

  async function salvar() {
    setErro("");
    setSucesso(false);

    if (!patient?.id) return setErro("Selecione um paciente primeiro.");
    if (!foto && !relato.trim()) {
      return setErro("Escolha uma foto ou escreva um relato.");
    }

    let anoNum: number | null = null;
    if (destino === "linha") {
      if (!ano.trim())
        return setErro("Para entrar na Linha da Vida, informe o ano.");
      anoNum = Number(ano);
      if (!Number.isInteger(anoNum) || anoNum < 1900 || anoNum > ANO_ATUAL) {
        return setErro(`Digite um ano entre 1900 e ${ANO_ATUAL}.`);
      }
    }

    // Título opcional: se ficar vazio, cria um automático
    const label =
      titulo.trim() || (anoNum ? `Lembrança de ${anoNum}` : "Lembrança");

    setSalvando(true);
    try {
      // Uma memória = um registro (foto + relato juntos, quando houver os dois)
      if (foto) {
        const path = await uploadArquivoMemoria(patient.id, foto);
        await uploadMemoria({
          pacienteId: patient.id,
          type: "photo",
          label,
          mediaPath: path,
          content: relato.trim() || undefined,
          ano: anoNum,
        });
      } else {
        await uploadMemoria({
          pacienteId: patient.id,
          type: "text",
          label,
          content: relato.trim(),
          ano: anoNum,
        });
      }

      removerFoto();
      setTitulo("");
      setAno("");
      setRelato("");
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
      await carregarMemorias();
    } catch (e) {
      console.error("Erro ao salvar memória:", e);
      setErro(mensagemErro(e, "Erro ao salvar a memória."));
    } finally {
      setSalvando(false);
    }
  }

  // Memórias antigas de áudio não aparecem mais; as demais ficam em ordem cronológica
  const lista = memorias
    .filter((m) => m.type !== "audio")
    .sort((a, b) => (a.ano ?? 9999) - (b.ano ?? 9999));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciador de Memórias</CardTitle>
        <CardDescription>
          Cadastrando memórias para:{" "}
          <strong className="text-foreground">
            {patient?.name ?? "Nenhum paciente selecionado"}
          </strong>
          . Fotos e relatos com o ano aparecem na Linha da Vida do paciente.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Selecionar foto"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
        />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Onde esta memória vai aparecer?</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                {
                  id: "baul",
                  titulo: "Memória do baú",
                  texto:
                    "Aparece no álbum e na Memória do Dia. Não precisa de ano.",
                },
                {
                  id: "linha",
                  titulo: "Linha da Vida",
                  texto:
                    "Aparece também na linha do tempo, na ordem dos anos. Precisa do ano.",
                },
              ] as const
            ).map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setDestino(op.id)}
                aria-pressed={destino === op.id}
                className={`rounded-xl border-2 p-3 text-left transition ${
                  destino === op.id
                    ? "border-[#0284c7] bg-[#0284c7]/10"
                    : "border-border bg-background hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold">{op.titulo}</p>
                <p className="text-xs text-muted-foreground">{op.texto}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          {/* Foto */}
          {fotoPreview ? (
            <div className="relative h-44 overflow-hidden rounded-xl border border-border md:h-full md:min-h-52">
              <img
                src={fotoPreview}
                alt="Pré-visualização da foto"
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={removerFoto}
                aria-label="Remover foto"
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex h-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#0284c7]/40 bg-[#0284c7]/5 text-sm font-medium text-[#0284c7] hover:bg-[#0284c7]/10 md:h-full md:min-h-52"
            >
              <ImagePlus className="size-8" />
              Adicionar foto
              <span className="text-xs font-normal text-muted-foreground">
                (opcional)
              </span>
            </button>
          )}

          {/* Dados */}
          <div className="flex flex-col gap-3">
            <div
              className={`grid grid-cols-1 gap-3 ${destino === "linha" ? "sm:grid-cols-[1fr_130px]" : ""}`}
            >
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título (ex.: Casamento com Maria)"
                aria-label="Título da memória"
              />
              {destino === "linha" && (
                <Input
                  value={ano}
                  onChange={(e) =>
                    setAno(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  inputMode="numeric"
                  placeholder="Ano (1975)"
                  aria-label="Ano da lembrança"
                />
              )}
            </div>
            <textarea
              value={relato}
              onChange={(e) => setRelato(e.target.value)}
              placeholder="Conte a história desta lembrança (opcional se tiver foto)..."
              rows={4}
              className="w-full flex-1 rounded-lg border border-border bg-background p-3 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={salvar}
            disabled={salvando}
            className="h-11 bg-[#0284c7] px-6 text-white hover:bg-[#0284c7]/90"
          >
            {salvando && <Loader2 className="mr-2 size-4 animate-spin" />}
            {salvando ? "Salvando..." : "Salvar memória"}
          </Button>
          {sucesso && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" />
              Memória salva!
            </span>
          )}
          {erro && <span className="text-sm text-red-600">{erro}</span>}
        </div>

        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">
            Memórias cadastradas ({lista.length})
          </h4>
          {lista.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma memória cadastrada ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {lista.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  {item.type === "photo" && item.url ? (
                    <img
                      src={item.url}
                      alt={item.label}
                      loading="lazy"
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <p className="line-clamp-5 h-32 overflow-hidden bg-slate-50 p-3 text-xs">
                      {item.content}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2 p-2.5">
                    <span className="truncate text-xs font-medium">
                      {item.label}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        item.ano
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.ano ?? "Baú"}
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
