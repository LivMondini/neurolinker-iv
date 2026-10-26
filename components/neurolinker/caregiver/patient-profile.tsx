"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Pencil,
  Trash2,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LifeTimeline, type TimelineMemoria } from "../patient/life-timeline";
import type { PatientSummary } from "@/lib/neurolinker-data";
import {
  fetchMemorias,
  obterUrlAssinada,
  updatePaciente,
  deleteMemoria,
  updateMemoria,
  rowToPatient,
} from "@/lib/supabase";

type MemoriaItem = TimelineMemoria & { media_path?: string | null };

export function PatientProfile({
  patient,
  onUpdated,
}: {
  patient: PatientSummary;
  onUpdated: (p: PatientSummary) => void;
}) {
  const [memorias, setMemorias] = useState<MemoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // edição da ficha
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(patient.name);
  const [age, setAge] = useState(String(patient.age));
  const [stage, setStage] = useState(
    patient.stage.replace(/^Est[aá]gio\s+/i, ""),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // exclusão de memória
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [delError, setDelError] = useState("");

  // edição de memória
  const [memEditId, setMemEditId] = useState<string | null>(null);
  const [memLabel, setMemLabel] = useState("");
  const [memContent, setMemContent] = useState("");
  const [memAno, setMemAno] = useState("");
  const [memSaving, setMemSaving] = useState(false);
  const [memError, setMemError] = useState("");

  function abrirEdicaoMemoria(m: MemoriaItem) {
    setMemEditId(m.id);
    setMemLabel(m.label);
    setMemContent(m.content ?? "");
    setMemAno(typeof m.ano === "number" ? String(m.ano) : "");
    setMemError("");
    setConfirmId(null);
  }

  async function salvarMemoria(e: React.FormEvent) {
    e.preventDefault();
    if (!memEditId) return;

    const anoAtual = new Date().getFullYear();
    const anoNum = memAno.trim() === "" ? null : Number(memAno);
    if (
      anoNum !== null &&
      (!Number.isInteger(anoNum) || anoNum < 1900 || anoNum > anoAtual)
    ) {
      setMemError(`O ano deve estar entre 1900 e ${anoAtual}.`);
      return;
    }
    if (!memLabel.trim()) {
      setMemError("O título não pode ficar vazio.");
      return;
    }

    setMemSaving(true);
    setMemError("");
    try {
      const novo = await updateMemoria(memEditId, {
        label: memLabel.trim(),
        content: memContent.trim() || null,
        ano: anoNum,
      });
      setMemorias((cur) =>
        cur.map((m) =>
          m.id === memEditId
            ? { ...m, label: novo.label, content: novo.content, ano: novo.ano }
            : m,
        ),
      );
      setMemEditId(null);
    } catch (err: any) {
      console.error("Erro ao editar memória:", err?.message, err?.code);
      setMemError("Não foi possível salvar a memória.");
    } finally {
      setMemSaving(false);
    }
  }

  const carregar = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const rows = (await fetchMemorias(patient.id)) as MemoriaItem[];
      const comUrl = await Promise.all(
        rows.map(async (m) => {
          if (m.type !== "photo" || !m.media_path) return m;
          try {
            return { ...m, url: await obterUrlAssinada(m.media_path) };
          } catch {
            return m;
          }
        }),
      );
      setMemorias(comUrl);
    } catch (err) {
      console.error(err);
      setLoadError("Não foi possível carregar as memórias.");
    } finally {
      setLoading(false);
    }
  }, [patient.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirEdicao() {
    setName(patient.name);
    setAge(String(patient.age));
    setStage(patient.stage.replace(/^Est[aá]gio\s+/i, ""));
    setSaveError("");
    setEditing(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !age) return;
    setSaving(true);
    setSaveError("");
    try {
      const row = await updatePaciente(patient.id, {
        name: name.trim(),
        age: Number(age),
        stage,
      });
      onUpdated(rowToPatient(row));
      setEditing(false);
    } catch (err: any) {
      console.error("Erro ao editar paciente:", err?.message, err?.code);
      setSaveError("Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  async function excluir(id: string) {
    setDeletingId(id);
    setDelError("");
    try {
      await deleteMemoria(id);
      setMemorias((cur) => cur.filter((m) => m.id !== id));
      setConfirmId(null);
    } catch (err: any) {
      console.error("Erro ao excluir memória:", err?.message, err?.code);
      setDelError("Não foi possível excluir a memória.");
    } finally {
      setDeletingId(null);
    }
  }

  const iniciais = patient.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex flex-col gap-6">
      {/* Ficha */}
      <section className="rounded-xl border bg-white p-4">
        {!editing ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={patient.avatarUrl} alt={patient.name} />
                <AvatarFallback>{iniciais}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{patient.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {patient.age} anos · {patient.stage}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{patient.status}</Badge>
                  <Badge variant="outline">
                    Engajamento: {patient.engagement} ({patient.engagementScore}
                    %)
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={abrirEdicao}>
              <Pencil data-icon="inline-start" />
              Editar dados
            </Button>
          </div>
        ) : (
          <form onSubmit={salvar}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="edit-name">Nome completo</FieldLabel>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit-age">Idade</FieldLabel>
                  <Input
                    id="edit-age"
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-stage">
                    Estágio da doença
                  </FieldLabel>
                  <select
                    id="edit-stage"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option>Inicial</option>
                    <option>Moderado</option>
                    <option>Avançado</option>
                  </select>
                </Field>
              </div>
            </FieldGroup>
            {saveError && (
              <p className="mt-3 text-sm font-medium text-red-600">
                {saveError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#0284c7] hover:bg-[#0284c7]/90"
              >
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        )}
      </section>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {loadError && (
        <p className="text-sm font-medium text-red-600">{loadError}</p>
      )}

      {!loading && !loadError && (
        <>
          {/* Linha da Vida (mesmo componente que o idoso vê) */}
          <LifeTimeline memorias={memorias} />

          {/* Memórias cadastradas */}
          <section className="rounded-xl border bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold">
              Memórias cadastradas ({memorias.length})
            </h3>
            {delError && (
              <p className="mb-2 text-sm font-medium text-red-600">
                {delError}
              </p>
            )}
            {memorias.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma memória cadastrada ainda.
              </p>
            ) : (
              <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                {memorias.map((m) => (
                  <li key={m.id} className="rounded-lg border p-3">
                    {memEditId === m.id ? (
                      <form
                        onSubmit={salvarMemoria}
                        className="flex flex-col gap-3"
                      >
                        <Field>
                          <FieldLabel htmlFor={`mem-label-${m.id}`}>
                            Título
                          </FieldLabel>
                          <Input
                            id={`mem-label-${m.id}`}
                            value={memLabel}
                            onChange={(e) => setMemLabel(e.target.value)}
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`mem-content-${m.id}`}>
                            Relato
                          </FieldLabel>
                          <textarea
                            id={`mem-content-${m.id}`}
                            value={memContent}
                            onChange={(e) => setMemContent(e.target.value)}
                            rows={3}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`mem-ano-${m.id}`}>
                            Ano (vazio = só no Baú)
                          </FieldLabel>
                          <Input
                            id={`mem-ano-${m.id}`}
                            type="number"
                            value={memAno}
                            onChange={(e) => setMemAno(e.target.value)}
                            placeholder="Ex: 1985"
                          />
                        </Field>
                        {memError && (
                          <p className="text-sm font-medium text-red-600">
                            {memError}
                          </p>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={memSaving}
                            onClick={() => setMemEditId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={memSaving}
                            className="bg-[#0284c7] hover:bg-[#0284c7]/90"
                          >
                            {memSaving && (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Salvar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {m.type === "photo" ? (
                            <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <FileText className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {m.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {m.type === "photo" ? "Foto" : "Relato"}
                              {typeof m.ano === "number"
                                ? ` · ${m.ano} (Linha da Vida)`
                                : " · Baú"}
                            </p>
                          </div>
                        </div>

                        {confirmId === m.id ? (
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={deletingId === m.id}
                              onClick={() => setConfirmId(null)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              disabled={deletingId === m.id}
                              onClick={() => excluir(m.id)}
                              className="bg-red-600 hover:bg-red-600/90"
                            >
                              {deletingId === m.id && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              )}
                              Confirmar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirEdicaoMemoria(m)}
                            >
                              <Pencil data-icon="inline-start" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => setConfirmId(m.id)}
                            >
                              <Trash2 data-icon="inline-start" />
                              Excluir
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
