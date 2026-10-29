"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { mapSupabaseAuthError } from "@/lib/utils"
import { senhaValida } from "@/lib/validation/password"
import { PasswordStrengthMeter } from "@/components/neurolinker/password-strength"

// Tela mostrada quando o cuidador chega pelo link do e-mail de "Esqueci minha senha".
export function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage("")

    // 1. Valida se a senha cumpre os critérios de senha forte (mínimo de caracteres, maiúsculas, números e bloqueio de 12345678)
    if (!senhaValida(password)) {
      setErrorMessage("A nova senha não atende a todos os critérios de segurança.")
      return
    }

    if (password !== confirm) {
      setErrorMessage("As senhas não são iguais.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      onDone()
    } catch (err) {
      console.error("Erro ao redefinir senha:", err)
      setErrorMessage(mapSupabaseAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Crie uma nova senha</h1>
        <p className="mt-2 text-muted-foreground">Escolha uma senha forte para a sua conta.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="text-sm font-medium">
            Nova senha
            <div className="relative mt-2">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            {/* Medidor visual de força de senha */}
            <PasswordStrengthMeter password={password} />
          </label>

          <label className="text-sm font-medium">
            Confirmar nova senha
            <Input
              className="mt-2"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>

          {errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}

          <Button
            type="submit"
            disabled={loading || !senhaValida(password) || password !== confirm}
            className="w-full bg-[#0284c7] hover:bg-[#0284c7]/90"
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Salvar nova senha
          </Button>
        </form>
      </section>
    </main>
  )
}