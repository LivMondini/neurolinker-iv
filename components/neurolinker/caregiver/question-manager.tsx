"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { trueFalseQuestions as initialQuestions, type TrueFalseQuestion, type PatientSummary } from "@/lib/neurolinker-data"

export function QuestionManager({ patient }: { patient?: PatientSummary }) {
  const [questions, setQuestions] = useState<TrueFalseQuestion[]>(initialQuestions)
  const [newQuestion, setNewQuestion] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [isTrue, setIsTrue] = useState(true)

  function handleAdd() {
    if (!newQuestion.trim()) return
    const question: TrueFalseQuestion = {
      id: `q-${Date.now()}`,
      question: newQuestion.trim(),
      correctAnswer: isTrue,
      category: newCategory.trim() || "Geral",
    }
    setQuestions((prev) => [question, ...prev])
    setNewQuestion("")
    setNewCategory("")
    setIsTrue(true)
  }

  function handleRemove(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciador do Jogo da Memória</CardTitle>
        <CardDescription>
          Cadastrando jogos para: <strong className="text-foreground">{patient?.name ?? "Nenhum paciente selecionado"}</strong>. Cadastre perguntas de Verdadeiro/Falso sobre a vida do idoso para alimentar o jogo no Baú do Paciente.
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
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="answer-switch">Resposta correta: {isTrue ? "Verdadeiro" : "Falso"}</FieldLabel>
              <div className="flex h-9 items-center gap-2">
                <Switch id="answer-switch" checked={isTrue} onCheckedChange={setIsTrue} />
              </div>
            </Field>
            <Button onClick={handleAdd} className="bg-[#0284c7] hover:bg-[#0284c7]/90">
              <Plus data-icon="inline-start" />
              Cadastrar
            </Button>
          </div>
        </FieldGroup>

        <Separator />

        <div className="flex flex-col gap-3">
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
                  <p className="text-sm font-medium text-foreground">{q.question}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary">{q.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Resposta: {q.correctAnswer ? "Verdadeiro" : "Falso"}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleRemove(q.id)}>
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
