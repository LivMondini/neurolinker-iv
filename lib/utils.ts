// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------ */
/* E-mail                                                              */
/* ------------------------------------------------------------------ */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Exige algo@dominio.tld (rejeita "foo", "foo@bar", espaços internos)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

const DOMINIOS_COMUNS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "yahoo.com.br",
  "uol.com.br",
];

// Distância de Levenshtein: quantas edições separam duas strings
function distancia(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => {
    const linha = new Array<number>(b.length + 1).fill(0);
    linha[0] = i;
    return linha;
  });
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

// Retorna o e-mail corrigido se o domínio parecer erro de digitação
// (ex.: "gail.com" -> "gmail.com"), senão null.
export function sugerirEmail(email: string): string | null {
  const [user, dominio] = normalizeEmail(email).split("@");
  if (!user || !dominio || DOMINIOS_COMUNS.includes(dominio)) return null;
  const melhor = DOMINIOS_COMUNS.find((d) => distancia(dominio, d) <= 1);
  return melhor ? `${user}@${melhor}` : null;
}

/* ------------------------------------------------------------------ */
/* Senha                                                               */
/* ------------------------------------------------------------------ */

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  return null;
}

/* ------------------------------------------------------------------ */
/* Erros do Supabase Auth                                              */
/* ------------------------------------------------------------------ */

// Aceita unknown porque, no catch, o erro chega tipado como unknown
export function mapSupabaseAuthError(error: unknown): string {
  if (!error) return "";
  const e = error as { message?: string; code?: string; status?: number };
  const msg = (e.message ?? "").toLowerCase();
  const code = (e.code ?? "").toLowerCase();

  if (msg.includes("failed to fetch") || msg.includes("network"))
    return "Sem conexão com o servidor. Verifique sua internet.";
  if (msg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  if (msg.includes("user already registered") || code === "user_already_exists")
    return "Este e-mail já está cadastrado.";
  if (
    msg.includes("unable to validate email") ||
    msg.includes("invalid email") ||
    code === "email_address_invalid"
  )
    return "E-mail inválido. Confira o endereço digitado.";
  if (
    msg.includes("email rate limit") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    e.status === 429
  )
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (msg.includes("signup is disabled") || msg.includes("signups not allowed"))
    return "O cadastro está temporariamente desativado.";
  if (msg.includes("password should be at least") || code === "weak_password")
    return "Senha fraca. Use pelo menos 8 caracteres.";
  if (msg.includes("same password") || code === "same_password")
    return "A nova senha deve ser diferente da anterior.";
  if (msg.includes("auth session missing") || code === "session_not_found")
    return "Sessão ausente ou expirada. Solicite um novo link de recuperação.";
  if (
    msg.includes("token has expired") ||
    msg.includes("otp_expired") ||
    code === "otp_expired" ||
    msg.includes("expired")
  )
    return "O link expirou. Solicite um novo e-mail de recuperação.";
  if (msg.includes("user not found")) return "Não encontramos uma conta com este e-mail.";

  console.error("[auth] erro não mapeado:", error);
  return "Não foi possível concluir a operação. Tente novamente.";
}