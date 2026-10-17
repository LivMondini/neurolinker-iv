"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { TrueFalseQuestion, PatientSummary } from "@/lib/neurolinker-data";
import {
  fetchPerguntasJogo,
  addPerguntaJogo,
  deletePerguntaJogo,
} from "@/lib/supabase";

type PerguntaRow = {
  id: string;
  question: string;
  correct_answer: boolean;
  category: string;
};

function rowToQuestion(r: PerguntaRow): TrueFalseQuestion {
  return {
    id: r.id,
    question: r.question,
    correctAnswer: r.correct_answer,
    category: r.category,
  };
}

function mensagemDeErro(e: unknown, padrao: string) {
  return e instanceof Error && e.message ? `${padrao} (${e.message})` : padrao;
}

export function QuestionManager({ patient }: { patient?: PatientSummary }) {
  const [questions, setQuestions] = useState<TrueFalseQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isTrue, setIsTrue] = useState(true);

  const patientId = patient?.id;

  const carregar = useCallback(async () => {
    if (!patientId) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = (await fetchPerguntasJogo(patientId)) as PerguntaRow[];
      setQuestions(rows.map(rowToQuestion));
    } catch (e) {
      setError(mensagemDeErro(e, "Não foi possível carregar as perguntas."));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleAdd() {
    if (!patientId || !newQuestion.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const row = (await addPerguntaJogo({
        pacienteId: patientId,
        question: newQuestion.trim(),
        correctAnswer: isTrue,
        category: newCategory.trim() || "Geral",
      })) as PerguntaRow;
      setQuestions((prev) => [rowToQuestion(row), ...prev]);
      setNewQuestion("");
      setNewCategory("");
      setIsTrue(true);
    } catch (e) {
      setError(mensagemDeErro(e, "Não foi possível salvar a pergunta."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    setError(null);
    try {
      await deletePerguntaJogo(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (e) {
      setError(mensagemDeErro(e, "Não foi possível remover a pergunta."));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciador do Jogo da Memória</CardTitle>
        <CardDescription>
          Cadastrando jogos para:{" "}
          <strong className="text-foreground">
            {patient?.name ?? "Nenhum paciente selecionado"}
          </strong>
          . Cadastre perguntas de Verdadeiro/Falso sobre a vida do idoso para
          alimentar o jogo no Baú do Paciente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <FieldGroup className="gap-4 rounded-xl border border-border bg-muted/30 p-4">
          <Field>
            <FieldLabel htmlFor="question-text">Pergunta</FieldLabel>
            <Input
              id="question-text"
              placeholder='Ex: "Sua primeira profissão foi Marceneiro?"'
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              disabled={!patientId}
            />
          </Field>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Field className="flex-1">
              <FieldLabel htmlFor="question-category">Categoria</FieldLabel>
              <Input
                id="question-category"
                placeholder="Ex: Profissão, Família, Origem"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                disabled={!patientId}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="answer-switch">
                Resposta correta: {isTrue ? "Verdadeiro" : "Falso"}
              </FieldLabel>
              <div className="flex h-9 items-center gap-2">
                <Switch
                  id="answer-switch"
                  checked={isTrue}
                  onCheckedChange={setIsTrue}
                  disabled={!patientId}
                />
              </div>
            </Field>
            <Button
              onClick={handleAdd}
              disabled={!patientId || !newQuestion.trim() || saving}
              className="bg-[#0284c7] hover:bg-[#0284c7]/90"
            >
              {saving ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Plus data-icon="inline-start" />
              )}
              {saving ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </FieldGroup>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        <Separator />

        <div className="flex flex-col gap-3">
          {!patientId && (
            <p className="text-sm text-muted-foreground">
              Selecione um paciente para ver e cadastrar perguntas.
            </p>
          )}
          {patientId && loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando
              perguntas...
            </p>
          )}
          {patientId && !loading && questions.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">
              Nenhuma pergunta cadastrada ainda para este paciente.
            </p>
          )}
          {questions.map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                {q.correctAnswer ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="size-5 shrink-0 text-rose-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {q.question}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary">{q.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Resposta: {q.correctAnswer ? "Verdadeiro" : "Falso"}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(q.id)}
                disabled={removingId === q.id}
                aria-label="Remover pergunta"
              >
                {removingId === q.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
