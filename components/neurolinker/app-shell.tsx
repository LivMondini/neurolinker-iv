"use client"

import { useState, useEffect, useRef } from "react"
import { Brain, LogOut, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LoginScreen } from "./login-screen"
import { CaregiverDashboard } from "./caregiver/caregiver-dashboard"
import { PatientChest } from "./patient/patient-chest"
import { PatientAccessScreen } from "./patient/patient-access-screen"
import { ResetPasswordScreen } from "./reset-password-screen"
import type { PatientSummary } from "@/lib/neurolinker-data"
import {
  supabase,
  fetchPacientes,
  rowToPatient,
  pacienteSair,
  emRecuperacaoDeSenha,
  encerrarRecuperacaoDeSenha,
  type BaulData,
} from "@/lib/supabase"

// "patient-access": pareamento (1ª vez) + PIN — fluxo real do paciente, sem cuidador logado.
// "patient": mostra o baú. Chega aqui de dois jeitos:
//   - via patient-access (sessão restaurada ou PIN certo) -> baulAtivo preenchido com dados reais
//   - via "Acessar conta" do cuidador (preview, sem PIN) -> activePatient (mock)
// "reset-password": cuidador chegou pelo link do e-mail de "Esqueci minha senha".
type Screen = "login" | "caregiver" | "patient-access" | "patient" | "reset-password"

// Se false, o paciente não vê o botão "Sair": a sessão dura até 15 dias sem uso e só o
// cuidador encerra o acesso (botão "Aparelhos" no painel). Mude para true para mostrar o Sair.
const PACIENTE_PODE_SAIR = false

export function AppShell() {
  const [screen, setScreen] = useState<Screen>("login")
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [activePatientId, setActivePatientId] = useState("")
  const [loadError, setLoadError] = useState("")
  const [baulAtivo, setBaulAtivo] = useState<BaulData | null>(null)
  // Evita que o login automático do link de recuperação jogue o cuidador direto no painel.
  const recoveringRef = useRef(false)

  const activePatient =
    patients.find((patient) => patient.id === activePatientId) ?? patients[0]

  // Sessão: só reage a SIGNED_IN / SIGNED_OUT (o paciente não tem sessão no Supabase).
  useEffect(() => {
    let active = true

    // A detecção é feita em lib/supabase.ts, antes de o client limpar a URL.
    if (emRecuperacaoDeSenha()) recoveringRef.current = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      if (session) setScreen(recoveringRef.current || emRecuperacaoDeSenha() ? "reset-password" : "caregiver")
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setPatients([])
        setActivePatientId("")
        setScreen("login")
      }
      if (event === "PASSWORD_RECOVERY") {
        recoveringRef.current = true
        setScreen("reset-password")
        setLoading(false)
        return
      }
      if (event === "SIGNED_IN" && session && !recoveringRef.current && !emRecuperacaoDeSenha()) {
        setScreen((current) => (current === "login" ? "caregiver" : current))
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // Carrega os pacientes do cuidador logado (a RLS garante que só vêm os dele).
  useEffect(() => {
    if (screen !== "caregiver") return
    let active = true

    setLoadError("")
    fetchPacientes()
      .then((rows) => {
        if (!active) return
        const list = rows.map(rowToPatient)
        setPatients(list)
        setActivePatientId((current) =>
          list.some((p) => p.id === current) ? current : (list[0]?.id ?? "")
        )
      })
      .catch((err) => {
        console.error(err)
        if (active) setLoadError("Não foi possível carregar os pacientes.")
      })

    return () => {
      active = false
    }
  }, [screen])

  async function handleLogout() {
    await supabase.auth.signOut()
    setPatients([])
    setActivePatientId("")
    setScreen("login")
  }

  // Saída da Área do Paciente (volta para a tela inicial de seleção).
  async function handlePatientExit() {
    await pacienteSair()
    setBaulAtivo(null)
    setScreen("login")
  }

  // O paciente já foi gravado no banco pelo PatientsTable; aqui só atualiza a lista na tela.
  function handleAddPatient(patient: PatientSummary) {
    setPatients((current) => [patient, ...current])
    setActivePatientId(patient.id)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#0284c7]">
            <Brain className="size-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-[#0f172a]">NeuroLinker</span>
        </div>

        {!loading && screen === "caregiver" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-muted-foreground"
          >
            <LogOut className="size-4" data-icon="inline-start" />
            Sair
          </Button>
        )}

        {/* No baú real do paciente (com sessão própria), o botão de sair encerra a sessão dele,
            não a do cuidador (que nem existe nesse fluxo). */}
        {!loading && screen === "patient" && baulAtivo && PACIENTE_PODE_SAIR && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePatientExit}
            className="gap-1.5 text-muted-foreground"
          >
            <LogOut className="size-4" data-icon="inline-start" />
            Sair
          </Button>
        )}
      </header>

      {loading && (
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && screen === "login" && (
        <LoginScreen onSelectPatient={() => setScreen("patient-access")} />
      )}

      {!loading && screen === "caregiver" && (
        <>
          {loadError && (
            <p className="px-6 pt-4 text-sm font-medium text-red-600">{loadError}</p>
          )}
          <CaregiverDashboard
            patients={patients}
            activePatient={activePatient}
            onSelectPatient={setActivePatientId}
            onAddPatient={handleAddPatient}
            onAccessPatient={(id) => {
              setActivePatientId(id)
              setBaulAtivo(null) // modo preview: sem dados reais do baú
              setScreen("patient")
            }}
          />
        </>
      )}

      {!loading && screen === "reset-password" && (
        <ResetPasswordScreen
          onDone={() => {
            recoveringRef.current = false
            encerrarRecuperacaoDeSenha()
            window.history.replaceState(null, "", window.location.pathname)
            setScreen("caregiver")
          }}
        />
      )}

      {!loading && screen === "patient-access" && (
        <PatientAccessScreen
          onBack={() => setScreen("login")}
          onEnter={(baul) => {
            setBaulAtivo(baul)
            setScreen("patient")
          }}
        />
      )}

      {!loading && screen === "patient" && (baulAtivo || activePatient) && (
        <PatientChest patient={!baulAtivo ? activePatient : undefined} baul={baulAtivo ?? undefined} />
      )}
    </div>
  )
}