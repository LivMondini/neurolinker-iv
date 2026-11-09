import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("[baul-midia] faltando:", {
      url: !!supabaseUrl,
      anon: !!anonKey,
      service: !!serviceKey,
    });
    return NextResponse.json({ error: "config" }, { status: 500 });
  }
  let sessionToken: unknown;
  try {
    ({ sessionToken } = await req.json());
  } catch {
    return NextResponse.json({ error: "corpo_invalido" }, { status: 400 });
  }
  if (typeof sessionToken !== "string" || sessionToken.length === 0) {
    return NextResponse.json({ error: "sem_sessao" }, { status: 401 });
  }

  // 1) valida a sessão e lê o baú com a chave anon (a função do banco decide)
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await anon.rpc("paciente_obter_baul", {
    p_session_token: sessionToken,
  });

  if (error) {
    console.error("[baul-midia] rpc:", error.message);
    return NextResponse.json({ error: "rpc" }, { status: 500 });
  }
  if (!data?.ok) {
    return NextResponse.json({ error: "sessao_invalida" }, { status: 401 });
  }

  // 2) assina as URLs das mídias com a service role (só no servidor)
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const memorias = await Promise.all(
    (data.memorias ?? []).map(
      async (m: { media_path: string | null } & Record<string, unknown>) => {
        if (!m.media_path) return { ...m, url: null };
        const { data: signed, error: errSign } = await admin.storage
          .from("memorias")
          .createSignedUrl(m.media_path, 3600);
        if (errSign) {
          console.error("[baul-midia] assinar:", errSign.message);
          return { ...m, url: null };
        }
        return { ...m, url: signed.signedUrl };
      },
    ),
  );

  return NextResponse.json({
    paciente: data.paciente,
    memorias,
    perguntas: data.perguntas ?? [],
  });
}
