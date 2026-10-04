"use client"

import { useState, useEffect } from "react"
import { Brain, LogOut, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LoginScreen } from "./login-screen"
import { CaregiverDashboard } from "./caregiver/caregiver-dashboard"
import { PatientChest } from "./patient/patient-chest"
import { PatientPinScreen } from "./patient/patient-pin-screen"
import type { PatientSummary } from "@/lib/neurolinker-data"
import { supabase, fetchPacientes, rowToPatient } from "@/lib/supabase"

type Screen = "login" | "caregiver" | "patient-pin" | "patient"

export function AppShell() {
  const [screen, setScreen] = useState<Screen>("login")
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [activePatientId, setActivePatientId] = useState("")
  const [loadError, setLoadError] = useState("")

  const activePatient =
    patients.find((patient) => patient.id === activePatientId) ?? patients[0]

  // Sessão: só reage a SIGNED_IN / SIGNED_OUT (o paciente não tem sessão no Supabase).
  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      if (session) setScreen("caregiver")
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
      if (event === "SIGNED_IN" && session) {
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

        {!loading && screen !== "login" && (
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
      </header>

      {loading && (
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && screen === "login" && (
        <LoginScreen onSelectPatient={() => setScreen("patient-pin")} />
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
              setScreen("patient")
            }}
          />
        </>
      )}

      {!loading && screen === "patient-pin" && activePatient && (
        <PatientPinScreen patient={activePatient} onSuccess={() => setScreen("patient")} />
      )}

      {/* Sem sessão de cuidador não há pacientes visíveis (a RLS bloqueia). */}
      {!loading && screen === "patient-pin" && !activePatient && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
          <p className="text-muted-foreground">
            Para abrir a Área do Paciente, o cuidador precisa entrar primeiro e escolher o paciente.
          </p>
          <Button variant="outline" onClick={() => setScreen("login")}>
            Voltar
          </Button>
        </div>
      )}

      {!loading && screen === "patient" && activePatient && <PatientChest patient={activePatient} />}
    </div>
  )
}