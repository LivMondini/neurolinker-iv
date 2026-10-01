"use client"

import { cn } from "@/lib/utils"
import { Users, Image, Gamepad2, FileBarChart } from "lucide-react"

export type CaregiverSection = "patients" | "memories" | "games" | "reports"

const NAV_ITEMS: { id: CaregiverSection; label: string; icon: typeof Users }[] = [
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "memories", label: "Memórias", icon: Image },
  { id: "games", label: "Jogos Cognitivos", icon: Gamepad2 },
  { id: "reports", label: "Relatórios", icon: FileBarChart },
]

interface CaregiverSidebarProps {
  active: CaregiverSection
  onChange: (section: CaregiverSection) => void
}

export function CaregiverSidebar({ active, onChange }: CaregiverSidebarProps) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-[#0f172a] lg:block">
        <nav className="flex flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#0284c7] text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-[#0f172a] p-2 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-[#0284c7] text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </>
  )
}
