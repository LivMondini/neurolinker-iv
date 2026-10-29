export interface PasswordStrength {
  score: number; // 0 a 4
  label: "Muito Fraca" | "Fraca" | "Média" | "Forte" | "Muito Forte";
  color: string;
  isValid: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "Muito Fraca", color: "bg-red-500", isValid: false };
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUppercase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;

  const isSequential = /^(12345678|abcdefgh|password|qwertyuiop)$/i.test(password);

  let label: PasswordStrength["label"] = "Muito Fraca";
  let color = "bg-red-500";

  switch (score) {
    case 1:
      label = "Muito Fraca";
      color = "bg-red-500";
      break;
    case 2:
      label = "Fraca";
      color = "bg-orange-500";
      break;
    case 3:
      label = "Média";
      color = "bg-yellow-500";
      break;
    case 4:
      label = "Muito Forte";
      color = "bg-green-600";
      break;
  }

  const isValid = score >= 3 && !isSequential;

  return { score, label, color, isValid };
}

export function senhaValida(password: string): boolean {
  return checkPasswordStrength(password).isValid;
}