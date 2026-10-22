-- 1) Ano da memória (usado pela linha do tempo)
alter table public.memorias
  add column if not exists ano smallint
  check (ano is null or ano between 1900 and 2100);

-- 2) Excluir paciente e tudo que depende dele.
-- ATENÇÃO: confira se as colunas "paciente_id" existem com esse nome nas
-- tabelas abaixo. Se alguma tabela já tem ON DELETE CASCADE, o delete extra
-- é inofensivo, mas se o nome da coluna for diferente o SQL dá erro.
create or replace function public.excluir_paciente(p_paciente_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.pacientes
    where id = p_paciente_id and caregiver_id = auth.uid()
  ) then
    raise exception 'Paciente não encontrado';
  end if;

  delete from public.sessoes_paciente   where paciente_id = p_paciente_id;
  delete from public.codigos_pareamento where paciente_id = p_paciente_id;
  delete from public.dispositivos       where paciente_id = p_paciente_id;
  delete from public.perguntas_jogo     where paciente_id = p_paciente_id;
  delete from public.memorias           where paciente_id = p_paciente_id;
  delete from public.pacientes          where id = p_paciente_id;
end;
$$;

revoke all on function public.excluir_paciente(uuid) from public, anon;
grant execute on function public.excluir_paciente(uuid) to authenticated;