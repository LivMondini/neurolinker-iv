import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  fotoUrl?: string | null;
  fotoLabel?: string;
  relato?: string | null;
  ano?: number | null;
};

export function MemoryOfDay({ fotoUrl, fotoLabel, relato, ano }: Props) {
  // Sem dados reais (preview com mock), mantém o conteúdo de exemplo
  const usandoMock = !fotoUrl && !relato;
  const imagem =
    fotoUrl ?? (usandoMock ? "/images/memoria-historica.png" : null);
  const texto =
    relato ??
    (usandoMock
      ? "Este é o dia do seu casamento com Maria, em 1975. Vocês escolheram uma pequena capela perto da casa dos seus pais para celebrar esse momento especial."
      : (fotoLabel ?? ""));
  const anoExibido = ano ?? (usandoMock ? 1975 : null);

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-md">
      <div
        className={cn("grid grid-cols-1", imagem && "sm:grid-cols-[1fr_1.4fr]")}
      >
        {imagem && (
          <div className="relative aspect-square sm:aspect-auto sm:min-h-72">
            <img
              src={imagem}
              alt={fotoLabel ?? "Foto da memória do dia"}
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-blue-700">
            <span className="flex items-center gap-2">
              <Sparkles className="size-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Memória do Dia
              </span>
            </span>
            {anoExibido && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-900">
                {anoExibido}
              </span>
            )}
          </div>

          {fotoLabel && !usandoMock && (
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {fotoLabel}
            </h2>
          )}

          {texto && texto !== fotoLabel && (
            <p className="text-xl font-medium leading-relaxed text-slate-800 sm:text-2xl">
              {texto}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
