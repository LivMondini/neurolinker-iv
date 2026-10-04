"use client"

import { useState } from "react"
import { Delete, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PatientSummary } from "@/lib/neurolinker-data"
import { verificarPin } from "@/lib/supabase"

// ATENÇÃO: hoje esta tela NÃO tem entrada no app (opção A: o cuidador abre o Baú
// pelo botão "Acessar conta"). Quando o login do paciente no próprio aparelho for
// construído (opção B), o PIN será conferido por uma Edge Function com limite de
// tentativas. Até lá, o PIN é conferido no banco (verificar_pin) e nunca no navegador.
export function PatientPinScreen({ patient, onSuccess }: { patient: PatientSummary; onSuccess: () => void }) {
  const [digits, setDigits] = useState("")
  const [showMessage, setShowMessage] = useState(false)
  const [checking, setChecking] = useState(false)
  const [technicalError, setTechnicalError] = useState(false)

  function handleChange(value: string) {
    setShowMessage(false)
    setTechnicalError(false)
    setDigits(value.replace(/\D/g, "").slice(0, 6))
  }

  function clearPin() {
    setShowMessage(false)
    setTechnicalError(false)
    setDigits("")
  }

  async function submit() {
    if (digits.length !== 6 || checking) return

    setChecking(true)
    setShowMessage(false)
    setTechnicalError(false)
    try {
      const ok = await verificarPin(patient.id, digits)
      if (ok) {
        onSuccess()
        return
      }
      setShowMessage(true)
    } catch (err) {
      console.error(err)
      setTechnicalError(true)
    } finally {
      setDigits("")
      setChecking(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-12">
        <div className="mx-auto max-w-md">
          <h1 className="text-[30px] font-bold text-slate-900 sm:text-4xl">Bem-vindo(a)!</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">Digite seu código de 6 números para acessar sua conta.</p>

          <label htmlFor="patient-pin" className="sr-only">Código de 6 números</label>
          <input
            id="patient-pin"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            value={digits}
            onChange={(event) => handleChange(event.target.value)}
            className="sr-only"
            aria-describedby="pin-help"
          />
          <div
            role="group"
            aria-label={`${digits.length} de 6 dígitos preenchidos`}
            className="my-8 flex justify-center gap-2 sm:gap-3"
            onClick={() => document.getElementById("patient-pin")?.focus()}
          >
            {Array.from({ length: 6 }, (_, index) => {
              const digit = digits[index]
              const isFilled = Boolean(digit)
              const isActive = index === digits.length && digits.length < 6
              return (
                <div
                  key={index}
                  aria-hidden="true"
                  className={`flex size-12 items-center justify-center rounded-xl border-2 text-3xl font-bold transition-colors sm:size-14 ${
                    isFilled
                      ? "border-2 border-blue-600 bg-blue-50/50 text-blue-950"
                      : isActive
                        ? "border-2 border-blue-600 bg-blue-50/50 text-blue-950"
                        : "border-2 border-slate-300 bg-slate-100 text-slate-400"
                  }`}
                >
                  {digit || <span className="text-2xl font-normal text-slate-300">—</span>}
                </div>
              )
            })}
          </div>
          <p id="pin-help" className="sr-only">Digite os números usando o teclado do dispositivo.</p>

          {showMessage && (
            <p role="status" className="mb-5 rounded-xl bg-amber-50 p-4 text-lg leading-relaxed text-amber-900">
              Puxa, parece que os números ficaram diferentes. Não se preocupe, vamos tentar de novo?
            </p>
          )}
          {technicalError && (
            <p role="status" className="mb-5 rounded-xl bg-amber-50 p-4 text-lg leading-relaxed text-amber-900">
              Não conseguimos verificar agora. Peça ajuda a quem cuida de você, por favor.
            </p>
          )}

          <div className="mx-auto grid max-w-sm grid-cols-3 gap-3" aria-label="Teclado numérico">
            {Array.from({ length: 9 }, (_, index) => {
              const number = String(index + 1)
              return (
                <Button
                  key={number}
                  type="button"
                  onClick={() => handleChange(`${digits}${number}`)}
                  disabled={digits.length === 6 || checking}
                  className="h-16 rounded-xl border border-slate-200 bg-slate-100 text-xl font-bold text-slate-900 shadow-none hover:bg-slate-200 active:bg-blue-100"
                  aria-label={`Número ${number}`}
                >
                  {number}
                </Button>
              )
            })}
            <Button type="button" onClick={clearPin} disabled={checking} variant="outline" className="h-16 rounded-xl border border-slate-200 bg-slate-100 text-base font-bold text-slate-900 hover:bg-slate-200 active:bg-blue-100">
              Limpar
            </Button>
            <Button type="button" onClick={() => handleChange(`${digits}0`)} disabled={digits.length === 6 || checking} className="h-16 rounded-xl border border-slate-200 bg-slate-100 text-xl font-bold text-slate-900 shadow-none hover:bg-slate-200 active:bg-blue-100" aria-label="Número zero">
              0
            </Button>
            <Button type="button" onClick={() => handleChange(digits.slice(0, -1))} disabled={!digits.length || checking} variant="outline" className="h-16 rounded-xl border border-slate-200 bg-slate-100 text-base font-bold text-slate-900 hover:bg-slate-200 active:bg-blue-100">
              <Delete data-icon="inline-start" />Apagar
            </Button>
          </div>

          <Button type="button" disabled={digits.length !== 6 || checking} onClick={submit} className="mt-4 h-14 w-full rounded-xl bg-blue-600 text-lg font-semibold text-white shadow-md hover:bg-blue-700">
            {checking && <Loader2 className="mr-2 size-5 animate-spin" />}
            Acessar a conta
          </Button>
        </div>
      </section>
    </main>
  )
}