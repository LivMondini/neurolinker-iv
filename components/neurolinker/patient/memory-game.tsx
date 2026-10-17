"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, PartyPopper, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trueFalseQuestions } from "@/lib/neurolinker-data";

type Props = {
  perguntas?: {
    id: string;
    question: string;
    correctAnswer: boolean;
    category?: string;
  }[];
};

export function MemoryGame({ perguntas }: Props) {
  const questions = perguntas ?? trueFalseQuestions;
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const current = questions[index];

  function handleAnswer(answer: boolean) {
    if (feedback || !current) return;
    const correct = answer === current.correctAnswer;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);

    timer.current = setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
        setFeedback(null);
      } else {
        setFinished(true);
      }
    }, 1200);
  }

  function handleRestart() {
    setIndex(0);
    setFeedback(null);
    setFinished(false);
    setScore(0);
  }

  return (
    <Card className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Gamepad2 className="size-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Jogo da Memória</h2>
      </div>

      {questions.length === 0 ? (
        <p className="text-lg text-slate-600">
          Ainda não há perguntas cadastradas. Peça ao seu cuidador para
          adicionar algumas.
        </p>
      ) : !finished ? (
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Pergunta {index + 1} de {questions.length}
          </p>
          <p className="text-xl font-medium leading-relaxed text-slate-800 sm:text-2xl">
            {current.question}
          </p>

          {feedback ? (
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2.5 text-lg font-semibold",
                feedback === "correct"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700",
              )}
            >
              {feedback === "correct" ? (
                <Check className="size-5" />
              ) : (
                <X className="size-5" />
              )}
              {feedback === "correct"
                ? "Muito bem!"
                : "Não foi essa, mas tudo bem!"}
            </div>
          ) : (
            <div className="flex w-full flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => handleAnswer(true)}
                className="h-14 flex-1 rounded-xl bg-emerald-600 text-lg font-bold text-white hover:bg-emerald-700"
              >
                <Check className="size-6" data-icon="inline-start" />
                Verdadeiro
              </Button>
              <Button
                size="lg"
                onClick={() => handleAnswer(false)}
                variant="outline"
                className="h-14 flex-1 rounded-xl border border-rose-300 bg-rose-50 text-lg font-bold text-rose-800 hover:bg-rose-100"
              >
                <X className="size-6" data-icon="inline-start" />
                Falso
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-blue-100 text-blue-800">
            <PartyPopper className="size-8" />
          </div>
          <p className="text-xl font-bold text-slate-900">
            Você terminou o jogo!
          </p>
          <p className="text-lg text-slate-700">
            Você acertou {score} de {questions.length} perguntas.
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
  );
}
