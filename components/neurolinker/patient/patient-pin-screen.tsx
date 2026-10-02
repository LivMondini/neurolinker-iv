"use client"

import { useState } from "react"
import { Delete } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PatientSummary } from "@/lib/neurolinker-data"

export function PatientPinScreen({ patient, onSuccess }: { patient: PatientSummary; onSuccess: () => void }) {
  const [digits, setDigits] = useState("")
  const [showMessage, setShowMessage] = useState(false)

  function handleChange(value: string) {
    setShowMessage(false)
    setDigits(value.replace(/\D/g, "").slice(0, 6))
  }

  function clearPin() {
    setShowMessage(false)
    setDigits("")
  }

  function submit() {
    if (digits === patient.pin || digits === "123456") {
      onSuccess()
      return
    }

    setShowMessage(true)
    setDigits("")
  }

  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-12">
        <div className="mx-auto max-w-md">
          <h1 className="text-[30px] font-bold text-slate-900 sm:text-4xl">Bem-vindo(a)!</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">Digite seu código de 6 números para acessar seu baú.</p>

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

          {showMessage && <p role="status" className="mb-5 rounded-xl bg-amber-50 p-4 text-lg leading-relaxed text-amber-900">Puxa, parece que os números ficaram diferentes. Não se preocupe, vamos tentar de novo?</p>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button type="button" onClick={clearPin} variant="outline" className="h-12 rounded-xl border border-slate-300 bg-slate-100 text-base font-medium text-slate-800 hover:bg-slate-200">
              <Delete data-icon="inline-start" />Apagar
            </Button>
            <Button type="button" disabled={digits.length !== 6} onClick={submit} className="h-12 rounded-xl bg-blue-600 text-base font-semibold text-white shadow-md hover:bg-blue-700">
              Acessar a conta
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

// O PIN de demonstração é 123456; pacientes cadastrados também aceitam o PIN exibido no painel.
// A entrada permanece visível para facilitar a conferência por pessoas idosas.
/**/
