import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  const { sessionToken } = await req.json();
  if (!sessionToken) return NextResponse.json({ ok: false }, { status: 401 });

  // 1. Valida a sessão do paciente pela mesma função que o app já usa
  const anonClient = createClient(url, anon);
  const { data, error } = await anonClient.rpc("paciente_obter_baul", {
    p_session_token: sessionToken,
  });
  if (error || !data?.ok)
    return NextResponse.json({ ok: false }, { status: 401 });

  // 2. Gera as URLs assinadas só dos arquivos que o RPC devolveu
  const admin = createClient(url, service);
  const memorias = await Promise.all(
    data.memorias.map(async (m: any) => {
      if (!m.media_path) return m;
      const { data: s } = await admin.storage
        .from("memorias")
        .createSignedUrl(m.media_path, 3600);
      return { ...m, url: s?.signedUrl ?? null };
    }),
  );

  return NextResponse.json({
    ok: true,
    paciente: data.paciente,
    memorias,
    perguntas: data.perguntas,
  });
}
