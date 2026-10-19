import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon) {
    console.error("[baul-midia] faltam variáveis NEXT_PUBLIC_SUPABASE_*");
    return NextResponse.json({ ok: false, reason: "config" }, { status: 500 });
  }

  let sessionToken: string | undefined;
  try {
    ({ sessionToken } = await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!sessionToken) return NextResponse.json({ ok: false }, { status: 401 });

  // 1. Valida a sessão do paciente
  const anonClient = createClient(url, anon);
  const { data, error } = await anonClient.rpc("paciente_obter_baul", {
    p_session_token: sessionToken,
  });

  if (error) {
    console.error("[baul-midia] erro no rpc:", error.message);
    return NextResponse.json({ ok: false, reason: "rpc" }, { status: 500 });
  }
  if (!data?.ok) return NextResponse.json({ ok: false }, { status: 401 });

  // 2. URLs assinadas das mídias (se a chave de serviço não existir, segue sem elas)
  let memorias = data.memorias;
  if (!service) {
    console.error(
      "[baul-midia] SUPABASE_SERVICE_ROLE_KEY não configurada: fotos não vão aparecer.",
    );
  } else {
    const admin = createClient(url, service);
    memorias = await Promise.all(
      data.memorias.map(async (m: any) => {
        if (!m.media_path) return m;
        const { data: s } = await admin.storage
          .from("memorias")
          .createSignedUrl(m.media_path, 3600);
        return { ...m, url: s?.signedUrl ?? null };
      }),
    );
  }

  return NextResponse.json({
    ok: true,
    paciente: data.paciente,
    memorias,
    perguntas: data.perguntas,
  });
}
