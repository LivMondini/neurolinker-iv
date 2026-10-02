"use client"

import { useState } from "react"
import { Brain, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginScreen } from "./login-screen"
import { CaregiverDashboard } from "./caregiver/caregiver-dashboard"
import { PatientChest } from "./patient/patient-chest"
import { PatientPinScreen } from "./patient/patient-pin-screen"
import { patients as initialPatients, type PatientSummary } from "@/lib/neurolinker-data"

type Screen = "login" | "caregiver" | "patient-pin" | "patient"

export function AppShell() {
  const [screen, setScreen] = useState<Screen>("login")
  const [currentView, setCurrentView] = useState<"login" | "dashboard">("login")
  const [patients, setPatients] = useState<PatientSummary[]>(initialPatients)
  const [activePatientId, setActivePatientId] = useState(initialPatients[0]?.id ?? "")
  const activePatient = patients.find((patient) => patient.id === activePatientId) ?? patients[0]

  function handleAddPatient(patient: PatientSummary) {
    setPatients((current) => [patient, ...current])
    setActivePatientId(patient.id)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#0284c7]"><Brain className="size-4 text-white" /></div>
          <span className="font-semibold tracking-tight text-[#0f172a]">NeuroLinker</span>
        </div>
        {screen !== "login" && <Button variant="ghost" size="sm" onClick={() => { setCurrentView("login"); setScreen("login") }} className="gap-1.5 text-muted-foreground"><LogOut className="size-4" data-icon="inline-start" />Sair</Button>}
      </header>
      {currentView === "login" && screen === "login" && <LoginScreen onSelectRole={(role) => {
        if (role === "patient") {
          setScreen("patient-pin")
          return
        }
        setCurrentView("dashboard")
        setScreen("caregiver")
      }} />}
      {screen === "caregiver" && <CaregiverDashboard patients={patients} activePatient={activePatient} onSelectPatient={setActivePatientId} onAddPatient={handleAddPatient} onAccessPatient={(id) => { setActivePatientId(id); setScreen("patient") }} />}
      {screen === "patient-pin" && activePatient && <PatientPinScreen patient={activePatient} onSuccess={() => setScreen("patient")} />}
      {screen === "patient" && <PatientChest patient={activePatient} />}
    </div>
  )
}
