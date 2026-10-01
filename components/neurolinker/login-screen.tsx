"use client"

import { Badge } from "@/components/ui/badge"
import { Brain, ShieldCheck, Lock, Eye, Stethoscope, Heart, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoginScreenProps {
  onSelectRole: (role: "caregiver" | "patient") => void
}

export function LoginScreen({ onSelectRole }: LoginScreenProps) {
  return (
    <div className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-2">
      {/* Left side */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-[#0f172a] px-8 py-12 sm:px-12 lg:px-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #0284c7, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #0284c7, transparent 70%)" }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#0284c7]">
            <Brain className="size-6 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">NeuroLinker</span>
        </div>

        <div className="relative z-10 max-w-md space-y-5">
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Conectando memórias, preservando identidades.
          </h1>
          <p className="text-base leading-relaxed text-slate-300">
            Uma plataforma de terapia de reminiscência e estimulação cognitiva pensada para pacientes com doenças
            neurodegenerativas e para os cuidadores que caminham junto com eles, todos os dias.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2">
          <Badge className="gap-1.5 border-white/10 bg-white/10 text-slate-200 hover:bg-white/10">
            <ShieldCheck className="size-3.5" />
            HIPAA Compliant
          </Badge>
          <Badge className="gap-1.5 border-white/10 bg-white/10 text-slate-200 hover:bg-white/10">
            <Eye className="size-3.5" />
            Acessibilidade WCAG AAA
          </Badge>
          <Badge className="gap-1.5 border-white/10 bg-white/10 text-slate-200 hover:bg-white/10">
            <Lock className="size-3.5" />
            Segurança Criptografada
          </Badge>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center justify-center bg-white px-8 py-16 sm:px-12 lg:px-16">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f172a]">Acesse o NeuroLinker</h2>
            <p className="text-muted-foreground">Selecione como você deseja entrar na plataforma.</p>
          </div>

          <div className="flex flex-col gap-4">
            <RoleCard
              icon={Stethoscope}
              title="Portal do Cuidador / Profissional"
              description="Gestão, relatórios e cadastro de memórias."
              accent="caregiver"
              onClick={() => onSelectRole("caregiver")}
            />
            <RoleCard
              icon={Heart}
              title="Área do Paciente (Seu João)"
              description="Modo simplificado, foco em memórias e jogos."
              accent="patient"
              onClick={() => onSelectRole("patient")}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleCard({
  icon: Icon,
  title,
  description,
  accent,
  onClick,
}: {
  icon: typeof Stethoscope
  title: string
  description: string
  accent: "caregiver" | "patient"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
        accent === "caregiver"
          ? "border-slate-200 hover:border-[#0284c7]/40 hover:bg-[#0284c7]/[0.04]"
          : "border-slate-200 hover:border-emerald-400/50 hover:bg-emerald-50/50",
      )}
    >
      <div
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-xl transition-colors",
          accent === "caregiver"
            ? "bg-[#0284c7]/10 text-[#0284c7] group-hover:bg-[#0284c7] group-hover:text-white"
            : "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white",
        )}
      >
        <Icon className="size-7" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-[#0f172a]">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
    </button>
  )
}
