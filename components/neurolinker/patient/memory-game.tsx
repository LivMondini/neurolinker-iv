"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, X, PartyPopper, Gamepad2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { trueFalseQuestions } from "@/lib/neurolinker-data"

export function MemoryGame() {
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)

  const current = trueFalseQuestions[index]

  function handleAnswer(answer: boolean) {
    if (feedback) return
    const correct = answer === current.correctAnswer
    setFeedback(correct ? "correct" : "wrong")
    if (correct) setScore((s) => s + 1)

    setTimeout(() => {
      if (index + 1 < trueFalseQuestions.length) {
        setIndex((i) => i + 1)
        setFeedback(null)
      } else {
        setFinished(true)
      }
    }, 1200)
  }

  function handleRestart() {
    setIndex(0)
    setFeedback(null)
    setFinished(false)
    setScore(0)
  }

  return (
    <Card className="flex flex-col gap-6 rounded-3xl border-2 border-emerald-200 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Gamepad2 className="size-6" />
        </div>
        <h2 className="text-2xl font-semibold text-[#2d2a26]">Jogo da Memória</h2>
      </div>

      {!finished ? (
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Pergunta {index + 1} de {trueFalseQuestions.length}
          </p>
          <p className="text-xl font-medium leading-relaxed text-[#2d2a26] sm:text-2xl">{current.question}</p>

          {feedback ? (
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2.5 text-lg font-semibold",
                feedback === "correct" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
              )}
            >
              {feedback === "correct" ? <Check className="size-5" /> : <X className="size-5" />}
              {feedback === "correct" ? "Muito bem!" : "Não foi essa, mas tudo bem!"}
            </div>
          ) : (
            <div className="flex w-full flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => handleAnswer(true)}
                className="h-16 flex-1 rounded-2xl bg-emerald-600 text-lg font-semibold hover:bg-emerald-700"
              >
                <Check className="size-6" data-icon="inline-start" />
                Verdadeiro
              </Button>
              <Button
                size="lg"
                onClick={() => handleAnswer(false)}
                variant="outline"
                className="h-16 flex-1 rounded-2xl border-2 border-rose-300 text-lg font-semibold text-rose-700 hover:bg-rose-50"
              >
                <X className="size-6" data-icon="inline-start" />
                Falso
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <PartyPopper className="size-8" />
          </div>
          <p className="text-xl font-semibold text-[#2d2a26]">Você terminou o jogo!</p>
          <p className="text-muted-foreground">
            Você acertou {score} de {trueFalseQuestions.length} perguntas.
          </p>
          <Button
            size="lg"
            onClick={handleRestart}
            className="rounded-2xl bg-emerald-600 text-base font-semibold hover:bg-emerald-700"
          >
            Jogar novamente
          </Button>
        </div>
      )}
    </Card>
  )
}
