"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Brain, ShieldCheck, Lock, Eye, Stethoscope, Heart, ChevronRight, ArrowLeft, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

interface LoginScreenProps {
  // O cuidador não precisa mais avisar o AppShell: o onAuthStateChange (SIGNED_IN) cuida disso.
  // Reservado para o login do paciente no próprio aparelho (opção B, ainda não construída).
  onSelectPatient?: () => void
}
type AuthMode = "login" | "signup" | "forgot"

function traduzirErro(msg: string) {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos."
  if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar."
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado."
  if (msg.toLowerCase().includes("rate limit")) return "Muitas tentativas. Aguarde um pouco."
  if (msg.includes("Password should be at least")) return "A senha precisa ter pelo menos 8 caracteres."
  return "Ocorreu um erro. Tente novamente."
}

export function LoginScreen(_props: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login")
  const [caregiverAuth, setCaregiverAuth] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (caregiverAuth) {
    return (
      <CaregiverAuth
        mode={mode}
        setMode={setMode}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        onBack={() => setCaregiverAuth(false)}
      />
    )
  }

  return (
    <div className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-2">
      <BrandPanel />
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
              onClick={() => setCaregiverAuth(true)}
            />
            <RoleCard
              icon={Heart}
              title="Área do Paciente"
              description="Modo simplificado, foco em memórias e jogos."
              accent="patient"
              disabled
              badge="Em breve"
              onClick={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function BrandPanel() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-[#0f172a] px-8 py-12 sm:px-12 lg:px-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
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
          Uma plataforma de terapia de reminiscência e estimulação cognitiva pensada para pacientes e cuidadores.
        </p>
      </div>
      <div className="relative z-10 flex flex-wrap gap-2">
        <Badge className="gap-1.5 border-white/10 bg-white/10 text-slate-200 hover:bg-white/10">
          <ShieldCheck className="size-3.5" />
          Acesso protegido por login
        </Badge>
        <Badge className="gap-1.5 border-white/10 bg-white/10 text-slate-200 hover:bg-white/10">
          <Eye className="size-3.5" />
          Foco em acessibilidade
        </Badge>
        <Badge className="gap-1.5 border-white/10 bg-white/10 text-slate-200 hover:bg-white/10">
          <Lock className="size-3.5" />
          Dados separados por cuidador
        </Badge>
      </div>
    </div>
  )
}

function CaregiverAuth({
  mode,
  setMode,
  showPassword,
  setShowPassword,
  onBack,
}: {
  mode: AuthMode
  setMode: (mode: AuthMode) => void
  showPassword: boolean
  setShowPassword: (value: boolean) => void
  onBack: () => void
}) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [infoMessage, setInfoMessage] = useState("")

  const title = mode === "login" ? "Bem-vindo de volta" : mode === "signup" ? "Crie sua conta" : "Recupere sua senha"

  function switchMode(newMode: AuthMode) {
    setErrorMessage("")
    setInfoMessage("")
    setMode(newMode)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage("")
    setInfoMessage("")

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        })
        if (error) throw error
        setInfoMessage("Se o e-mail existir, você receberá as instruções em instantes.")
        return
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error

        // Se veio sessão, o AppShell navega sozinho pelo evento SIGNED_IN.
        if (!data.session) {
          switchMode("login") // primeiro troca o modo (isso limpa as mensagens)...
          setInfoMessage("Conta criada! Se pedirmos confirmação, verifique seu e-mail antes de entrar.") // ...depois mostra a mensagem
          setPassword("")
        }
        return
      }

      // Login: o AppShell navega sozinho pelo evento SIGNED_IN.
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      setErrorMessage(traduzirErro(msg))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true)
      setErrorMessage("")
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      })
      if (error) throw error
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      setErrorMessage(traduzirErro(msg))
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center bg-white px-8 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md space-y-6">
          <Button variant="ghost" onClick={onBack} className="-ml-3 gap-2 text-muted-foreground">
            <ArrowLeft data-icon="inline-start" />
            Voltar
          </Button>

          <div>
            <h2 className="text-2xl font-semibold text-[#0f172a]">{title}</h2>
            <p className="mt-2 text-muted-foreground">Acesse seu espaço seguro de cuidado.</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="text-sm font-medium">
                Nome completo
                <Input
                  className="mt-2"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </label>
            )}

            <label className="text-sm font-medium">
              E-mail
              <Input
                className="mt-2"
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            {mode !== "forgot" && (
              <label className="text-sm font-medium">
                Senha
                <div className="relative mt-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={mode === "signup" ? 8 : undefined}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="-mt-2 self-end text-sm font-medium text-[#0284c7] hover:underline"
              >
                Esqueci minha senha
              </button>
            )}

            {errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
            {infoMessage && <p className="text-sm font-medium text-emerald-600">{infoMessage}</p>}

            <Button type="submit" disabled={loading} className="w-full bg-[#0284c7] hover:bg-[#0284c7]/90">
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar instruções"}
            </Button>

            {mode === "login" && (
              <>
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-muted-foreground">ou</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                >
                  Continuar com o Google
                </Button>
              </>
            )}

            {mode === "login" ? (
              <p className="text-center text-sm text-muted-foreground">
                Ainda não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-medium text-[#0284c7] hover:underline"
                >
                  Criar conta
                </button>
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-medium text-[#0284c7] hover:underline"
                >
                  Voltar para login
                </button>
              </p>
            )}
          </form>
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
  disabled = false,
  badge,
}: {
  icon: typeof Stethoscope
  title: string
  description: string
  accent: "caregiver" | "patient"
  onClick: () => void
  disabled?: boolean
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg",
        disabled && "pointer-events-none opacity-60",
        accent === "caregiver"
          ? "border-slate-200 hover:border-[#0284c7]/40 hover:bg-[#0284c7]/[0.04]"
          : "border-slate-200 hover:border-emerald-400/50 hover:bg-emerald-50/50"
      )}
    >
      <div
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-xl",
          accent === "caregiver"
            ? "bg-[#0284c7]/10 text-[#0284c7] group-hover:bg-[#0284c7] group-hover:text-white"
            : "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white"
        )}
      >
        <Icon className="size-7" />
      </div>
      <div className="flex-1">
        <h3 className="flex items-center gap-2 font-semibold text-[#0f172a]">
          {title}
          {badge && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {badge}
            </span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="size-5 text-muted-foreground" />
    </button>
  )
}