"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PatientPinScreen } from "./patient-pin-screen"
import {
  limparTokenDispositivo,
  limparTokenSessao,
  obterBaul,
  obterTokenDispositivo,
  pacienteEntrar,
  parearDispositivo,
  type BaulData,
} from "@/lib/supabase"

// Ponto de entrada da Área do Paciente (chamado pelo RoleCard em login-screen.tsx).
// 1) Aparelho não pareado: pede o código de 8 caracteres gerado pelo cuidador.
// 2) Aparelho pareado com sessão válida (até 15 dias sem uso): entra direto no baú.
// 3) Aparelho pareado sem sessão válida: pede o PIN de 6 dígitos.
export function PatientAccessScreen({
  onEnter,
  onBack,
}: {
  onEnter: (baul: BaulData) => void
  onBack: () => void
}) {
  const [checking, setChecking] = useState(true)
  const [paired, setPaired] = useState(false)
  const [aviso, setAviso] = useState("")

  useEffect(() => {
    let active = true

    async function iniciar() {
      if (!obterTokenDispositivo()) {
        if (active) setChecking(false) // não pareado: mostra o código
        return
      }

      setPaired(true)
      try {
        // Se ainda existe uma sessão válida, entra direto, sem PIN
        const baul = await obterBaul()
        if (!active) return
        if (baul) {
          onEnter(baul)
          return
        }

        // Sem sessão válida. Antes de pedir o PIN, confere se o aparelho ainda é aceito
        // (o cuidador pode ter revogado). Com PIN vazio o banco só valida o aparelho:
        // não gasta tentativa e não cria sessão.
        const sonda = await pacienteEntrar("")
        if (!active) return
        if (!sonda.ok && sonda.motivo === "dispositivo_invalido") {
          limparTokenDispositivo()
          limparTokenSessao()
          setAviso("Este aparelho foi desconectado. Peça um novo código a quem cuida de você.")
          setPaired(false)
        }
      } catch (err) {
        console.error("[NeuroLinker] erro ao restaurar sessão:", err)
      }
      if (active) setChecking(false)
    }

    iniciar()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handlePinSuccess() {
    // Falha de rede ou sessão que não vale logo após o PIN: o erro sobe para a tela do PIN,
    // que mostra o aviso e deixa o paciente tentar de novo.
    const baul = await obterBaul()
    if (!baul) throw new Error("sessao_nao_restaurada")
    onEnter(baul)
  }

  if (checking) {
    return (
      <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (!paired) {
    return <PairingStep onBack={onBack} onPaired={() => { setAviso(""); setPaired(true) }} aviso={aviso} />
  }

  return (
    <PatientPinScreen
      onSuccess={handlePinSuccess}
      onBack={onBack}
      onDeviceInvalid={() => {
        setAviso("Este aparelho foi desconectado. Peça um novo código a quem cuida de você.")
        setPaired(false)
      }}
    />
  )
}

function PairingStep({
  onBack,
  onPaired,
  aviso,
}: {
  onBack: () => void
  onPaired: () => void
  aviso?: string
}) {
  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (codigo.trim().length !== 8 || loading) return

    setLoading(true)
    setErrorMessage("")
    try {
      await parearDispositivo(codigo)
      onPaired()
    } catch (err: any) {
      console.error("Erro no pareamento:", err?.message, err?.code)
      if (err?.message?.includes("codigo_invalido_ou_expirado")) {
        setErrorMessage("Código inválido ou expirado. Peça um novo código a quem cuida de você.")
      } else if (err?.code === "PGRST202") {
        setErrorMessage("O pareamento ainda não está configurado no servidor.")
      } else {
        setErrorMessage("Não foi possível conectar. Verifique a internet e tente de novo.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-12">
        <Button variant="ghost" onClick={onBack} className="-ml-3 mb-4 gap-2 text-muted-foreground">
          <ArrowLeft data-icon="inline-start" />
          Voltar
        </Button>

        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Primeiro acesso neste aparelho</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Peça para quem cuida de você gerar um código no painel, e digite esse código abaixo. Isso só precisa ser
          feito uma vez neste aparelho.
        </p>

        {aviso && (
          <p role="status" className="mt-4 rounded-xl bg-amber-50 p-4 text-base leading-relaxed text-amber-900">
            {aviso}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 8))}
            placeholder="Ex: AB3D9F2K"
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            className="h-14 text-center font-mono text-2xl tracking-[0.3em]"
            aria-label="Código de pareamento de 8 caracteres"
          />

          {errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}

          <Button
            type="submit"
            disabled={codigo.trim().length !== 8 || loading}
            className="h-12 bg-[#0284c7] hover:bg-[#0284c7]/90"
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Continuar
          </Button>
        </form>
      </section>
    </main>
  )
}