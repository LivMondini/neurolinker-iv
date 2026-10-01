"use client"

import { useEffect, useRef, useState } from "react"
import { Delete } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PatientSummary } from "@/lib/neurolinker-data"

export function PatientPinScreen({ patient, onSuccess }: { patient: PatientSummary; onSuccess: () => void }) {
  const [digits, setDigits] = useState("")
  const [showMessage, setShowMessage] = useState(false)
  const keypadRef = useRef<HTMLDivElement>(null)

  useEffect(() => { keypadRef.current?.focus() }, [])

  function press(value: string) {
    setShowMessage(false)
    if (value === "back") return setDigits((current) => current.slice(0, -1))
    if (digits.length < 6) setDigits((current) => current + value)
  }

  function submit() {
    if (digits === patient.pin || digits === "123456") onSuccess()
    else {
      setShowMessage(true)
      setDigits("")
      keypadRef.current?.focus()
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#fbf3e7] px-5 py-10">
      <section className="w-full max-w-lg rounded-3xl border-2 border-amber-200 bg-white p-6 text-center shadow-lg sm:p-10">
        <h1 className="text-4xl font-bold text-[#2d2a26] sm:text-5xl">Bem-vindo(a)!</h1>
        <p className="mt-3 text-xl text-slate-700">Digite seu código de 6 números para acessar seu baú.</p>
        <div aria-label={`${digits.length} de 6 dígitos preenchidos`} aria-live="polite" className="mx-auto my-7 flex max-w-xs justify-center gap-3 rounded-2xl bg-amber-50 px-4 py-5">
          {Array.from({ length: 6 }, (_, index) => <span key={index} className={`flex size-8 items-center justify-center rounded-full border-2 ${index < digits.length ? "border-slate-900 bg-slate-900" : "border-slate-400 bg-transparent"}`}><span className="sr-only">{index < digits.length ? "Preenchido" : "Vazio"}</span></span>)}
        </div>
        {showMessage && <p role="status" className="mb-5 rounded-xl bg-amber-50 p-4 text-lg leading-relaxed text-amber-900">Puxa, parece que os números ficaram diferentes. Não se preocupe, vamos tentar de novo?</p>}
        <div ref={keypadRef} tabIndex={-1} className="mx-auto grid max-w-xs grid-cols-3 gap-3 outline-none" aria-label="Teclado numérico">
          {["1","2","3","4","5","6","7","8","9","0"].map((key) => <Button key={key} type="button" onClick={() => press(key)} className="h-16 rounded-2xl bg-slate-100 text-3xl font-bold text-slate-900 hover:bg-amber-100">{key}</Button>)}
          <Button type="button" onClick={() => press("back")} variant="outline" className="col-span-2 h-16 rounded-2xl text-lg"><Delete data-icon="inline-start" />Apagar</Button>
        </div>
        <Button type="button" disabled={digits.length !== 6} onClick={submit} className="mt-6 h-14 w-full rounded-2xl bg-amber-600 text-xl font-bold hover:bg-amber-700">Acessar a conta</Button>
      </section>
    </main>
  )
}

// O PIN de demonstração é 123456; pacientes cadastrados também aceitam o PIN exibido no painel.
// O foco retorna ao teclado após uma tentativa inválida para manter o fluxo acessível.

/**/ 
