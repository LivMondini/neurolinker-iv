// Lista de erros de digitação e domínios inválidos frequentes
const BLOCKED_DOMAINS = ['ail.com', 'gmai.com', 'hotmai.com', 'outlok.com', 'yaho.com'];

export function isValidEmailDomain(email: string): { isValid: boolean; message?: string } {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Digite um e-mail em formato válido." };
  }

  const domain = email.split('@')[1]?.toLowerCase();

  if (BLOCKED_DOMAINS.includes(domain)) {
    return { 
      isValid: false, 
      message: `O domínio @${domain} é inválido ou foi digitado incorretamente. Use um e-mail válido (ex: @gmail.com).` 
    };
  }

  return { isValid: true };
}