"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Delete, Loader2, SmartphoneNfc } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PatientSummary } from "@/lib/neurolinker-data"
import { limparTokenDispositivo, limparTokenSessao, obterTokenDispositivo, pacienteEntrar } from "@/lib/supabase"

// Fluxo real do paciente (opção A): este aparelho precisa já estar vinculado
// pelo cuidador (ver vincularDispositivo em lib/supabase.ts). O PIN é conferido
// no banco (função paciente_entrar), nunca no navegador. Depois de 5 erros, o
// aparelho fica bloqueado por 15 minutos. A sessão criada aqui dura até 15 dias
// sem uso (ver migration 002); passado isso, o PIN é pedido de novo.
export function PatientPinScreen({
  onSuccess,
  onBack,
  onDeviceInvalid,
}: {
  patient?: PatientSummary
  // Pode ser assíncrono: se lançar erro, a tela mostra o aviso de "não conseguimos verificar".
  onSuccess: () => void | Promise<void>
  onBack?: () => void
  // Chamado quando o banco recusa o aparelho (revogado ou removido): o token local
  // é apagado e quem usa esta tela deve voltar para o pareamento.
  onDeviceInvalid?: () => void
}) {
  const [digits, setDigits] = useState("")
  const [checking, setChecking] = useState(false)
  const [deviceLinked, setDeviceLinked] = useState<boolean | null>(null)

  const [errorMessage, setErrorMessage] = useState("")
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)
  const [technicalError, setTechnicalError] = useState(false)

  useEffect(() => {
    setDeviceLinked(Boolean(obterTokenDispositivo()))
  }, [])

  // Atualiza o texto do bloqueio a cada segundo, até acabar.
  const [, forceTick] = useState(0)
  useEffect(() => {
    if (!lockedUntil) return
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [lockedUntil])

  const isLocked = Boolean(lockedUntil && lockedUntil.getTime() > Date.now())

  function minutosRestantes() {
    if (!lockedUntil) return 0
    return Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 60000))
  }

  function handleChange(value: string) {
    setErrorMessage("")
    setTechnicalError(false)
    setDigits(value.replace(/\D/g, "").slice(0, 6))
  }

  function clearPin() {
    setErrorMessage("")
    setTechnicalError(false)
    setDigits("")
  }

  async function submit() {
    if (digits.length !== 6 || checking || isLocked) return

    setChecking(true)
    setErrorMessage("")
    setTechnicalError(false)
    try {
      const resultado = await pacienteEntrar(digits)

      if (resultado.ok) {
        await onSuccess()
        return
      }

      switch (resultado.motivo) {
        case "dispositivo_invalido":
          // Aparelho revogado ou removido no painel: esquece o token e volta ao pareamento
          limparTokenDispositivo()
          limparTokenSessao()
          if (onDeviceInvalid) onDeviceInvalid()
          else setDeviceLinked(false)
          break
        case "bloqueado":
          setLockedUntil(resultado.bloqueadoAte ? new Date(resultado.bloqueadoAte) : new Date(Date.now() + 15 * 60000))
          setAttemptsLeft(0)
          break
        case "pin_incorreto":
        case "pin_invalido":
          setAttemptsLeft(resultado.tentativasRestantes ?? null)
          setErrorMessage("Puxa, parece que os números ficaram diferentes. Não se preocupe, vamos tentar de novo?")
          break
      }
    } catch (err) {
      console.error(err)
      setTechnicalError(true)
    } finally {
      setDigits("")
      setChecking(false)
    }
  }

  // Este aparelho ainda não foi vinculado a nenhum paciente pelo cuidador.
  if (deviceLinked === false) {
    return (
      <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50 px-5 py-10">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-12">
          <SmartphoneNfc className="mx-auto size-10 text-slate-400" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Este aparelho ainda não está pronto</h1>
          <p className="mt-3 text-lg leading-relaxed text-slate-600">
            Peça para quem cuida de você vincular este aparelho antes de continuar.
          </p>
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="mt-6 gap-2 text-muted-foreground">
              <ArrowLeft data-icon="inline-start" />
              Sou cuidador
            </Button>
          )}
        </section>
      </main>
    )
  }

  // Ainda verificando se há token de dispositivo salvo (evita piscar a tela errada).
  if (deviceLinked === null) {
    return (
      <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50 px-5 py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
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
            disabled={isLocked}
          />
          <div
            role="group"
            aria-label={`${digits.length} de 6 dígitos preenchidos`}
            className="my-8 flex justify-center gap-2 sm:gap-3"
            onClick={() => !isLocked && document.getElementById("patient-pin")?.focus()}
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
                    isFilled || isActive
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

          {isLocked && (
            <p role="status" className="mb-5 rounded-xl bg-amber-50 p-4 text-lg leading-relaxed text-amber-900">
              Muitas tentativas. Espere {minutosRestantes()} {minutosRestantes() === 1 ? "minuto" : "minutos"} e tente de novo, ou peça ajuda a quem cuida de você.
            </p>
          )}
          {!isLocked && errorMessage && (
            <p role="status" className="mb-5 rounded-xl bg-amber-50 p-4 text-lg leading-relaxed text-amber-900">
              {errorMessage}
              {typeof attemptsLeft === "number" && attemptsLeft > 0 && attemptsLeft < 5 && (
                <span className="mt-1 block text-base">
                  {attemptsLeft} {attemptsLeft === 1 ? "tentativa restante" : "tentativas restantes"}
                </span>
              )}
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
                  disabled={digits.length === 6 || checking || isLocked}
                  className="h-16 rounded-xl border border-slate-200 bg-slate-100 text-xl font-bold text-slate-900 shadow-none hover:bg-slate-200 active:bg-blue-100"
                  aria-label={`Número ${number}`}
                >
                  {number}
                </Button>
              )
            })}
            <Button type="button" onClick={clearPin} disabled={checking || isLocked} variant="outline" className="h-16 rounded-xl border border-slate-200 bg-slate-100 text-base font-bold text-slate-900 hover:bg-slate-200 active:bg-blue-100">
              Limpar
            </Button>
            <Button type="button" onClick={() => handleChange(`${digits}0`)} disabled={digits.length === 6 || checking || isLocked} className="h-16 rounded-xl border border-slate-200 bg-slate-100 text-xl font-bold text-slate-900 shadow-none hover:bg-slate-200 active:bg-blue-100" aria-label="Número zero">
              0
            </Button>
            <Button type="button" onClick={() => handleChange(digits.slice(0, -1))} disabled={!digits.length || checking || isLocked} variant="outline" className="h-16 rounded-xl border border-slate-200 bg-slate-100 text-base font-bold text-slate-900 hover:bg-slate-200 active:bg-blue-100">
              <Delete data-icon="inline-start" />Apagar
            </Button>
          </div>

          <Button type="button" disabled={digits.length !== 6 || checking || isLocked} onClick={submit} className="mt-4 h-14 w-full rounded-xl bg-blue-600 text-lg font-semibold text-white shadow-md hover:bg-blue-700">
            {checking && <Loader2 className="mr-2 size-5 animate-spin" />}
            Acessar a conta
          </Button>

          {onBack && (
            <Button type="button" variant="ghost" onClick={onBack} disabled={checking} className="mt-3 w-full gap-2 text-sm text-muted-foreground">
              <ArrowLeft data-icon="inline-start" />
              Sou cuidador
            </Button>
          )}
        </div>
      </section>
    </main>
  )
}