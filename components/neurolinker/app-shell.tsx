"use client"

import { useState } from "react"
import { Brain, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginScreen } from "./login-screen"
import { CaregiverDashboard } from "./caregiver/caregiver-dashboard"
import { PatientChest } from "./patient/patient-chest"

type Screen = "login" | "caregiver" | "patient"

export function AppShell() {
  const [screen, setScreen] = useState<Screen>("login")

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#0284c7]">
            <Brain className="size-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-[#0f172a]">NeuroLinker</span>
        </div>
        {screen !== "login" && (
          <Button variant="ghost" size="sm" onClick={() => setScreen("login")} className="gap-1.5 text-muted-foreground">
            <LogOut className="size-4" data-icon="inline-start" />
            Sair
          </Button>
        )}
      </header>

      {screen === "login" && <LoginScreen onSelectRole={(role) => setScreen(role)} />}
      {screen === "caregiver" && <CaregiverDashboard />}
      {screen === "patient" && <PatientChest />}
    </div>
  )
}
