alter table public.edicao
add column if not exists resource_id uuid null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'edicao_resource_id_fkey'
    ) then
        alter table public.edicao
        add constraint edicao_resource_id_fkey
        foreign key (resource_id)
        references public.resources (id)
        on delete set null;
    end if;
end $$;

create index if not exists idx_edicao_resource_id
on public.edicao (resource_id);