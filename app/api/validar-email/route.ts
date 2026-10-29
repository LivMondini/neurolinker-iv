import { NextResponse } from "next/server"
import { isValidEmailDomain } from "@/lib/validation/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { erro: "O e-mail é obrigatório." },
        { status: 400 }
      )
    }

    const validacao = isValidEmailDomain(email)

    if (!validacao.isValid) {
      return NextResponse.json(
        { erro: validacao.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ valido: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { erro: "Erro ao validar o e-mail." },
      { status: 500 }
    )
  }
}