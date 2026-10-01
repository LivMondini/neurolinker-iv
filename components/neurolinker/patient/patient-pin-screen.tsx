"use client"

import { useEffect, useRef, useState } from "react"
import { Delete, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PatientSummary } from "@/lib/neurolinker-data"

export function PatientPinScreen({ patient, onSuccess }: { patient: PatientSummary; onSuccess: () => void }) {
  const [digits, setDigits] = useState("")
  const [error, setError] = useState(false)
  const keypadRef = useRef<HTMLDivElement>(null)
  useEffect(() => { keypadRef.current?.focus() }, [])
  function press(value: string) { setError(false); if (value === "back") return setDigits((current) => current.slice(0, -1)); if (digits.length < 6) setDigits((current) => current + value) }
  function submit() { if (digits === patient.pin) onSuccess(); else { setError(true); setDigits(""); keypadRef.current?.focus() } }
  return <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#fbf3e7] px-5 py-10"><section className="w-full max-w-lg rounded-3xl border-2 border-amber-200 bg-white p-6 text-center shadow-lg sm:p-10"><Heart className="mx-auto size-10 fill-amber-400 text-amber-500" /><h1 className="mt-4 text-3xl font-bold text-[#2d2a26]">Olá, {patient.name.split(" ")[0]}!</h1><p className="mt-2 text-lg text-muted-foreground">Digite seu código de 6 números para abrir seu baú.</p><div aria-live="polite" className="mx-auto my-7 flex max-w-xs justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-5 text-3xl font-bold tracking-[0.5em] text-[#2d2a26]">{digits.padEnd(6, "•")}</div>{error && <p className="mb-5 rounded-xl bg-amber-50 p-3 text-base leading-relaxed text-amber-800">Puxa, parece que os números ficaram diferentes. Não se preocupe, vamos tentar de novo com calma?</p>}<div ref={keypadRef} tabIndex={-1} className="mx-auto grid max-w-xs grid-cols-3 gap-3 outline-none" aria-label="Teclado numérico"><>{["1","2","3","4","5","6","7","8","9","0"].map((key) => <Button key={key} type="button" onClick={() => press(key)} className="h-16 rounded-2xl bg-slate-100 text-3xl font-bold text-slate-900 hover:bg-amber-100">{key}</Button>)}<Button type="button" onClick={() => press("back")} variant="outline" className="col-span-2 h-16 rounded-2xl text-lg"><Delete data-icon="inline-start" />Apagar</Button></></div><Button type="button" disabled={digits.length !== 6} onClick={submit} className="mt-6 h-14 w-full rounded-2xl bg-amber-600 text-xl font-bold hover:bg-amber-700">Abrir meu baú</Button></section></main>
}
