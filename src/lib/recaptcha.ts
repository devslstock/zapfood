const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/**
 * Sem RECAPTCHA_SECRET_KEY configurada, a verificação é pulada (retorna válido)
 * para o cadastro continuar funcionando em dev/local sem setup extra — mesmo
 * padrão do Resend/Supabase neste projeto. Configure a chave antes de ir ao ar.
 */
export async function verifyRecaptcha(token: string | null): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;

  if (!token) return false;

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("[recaptcha] falha ao verificar token", error);
    return false;
  }
}
