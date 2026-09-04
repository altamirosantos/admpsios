import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

/** Resumo da empresa associada (via filial) exibido em cada colaborador. */
export interface ColaboradorEmpresaSummary {
  id: string;
  nome: string;
}

/** Resumo da filial do colaborador (com a empresa aninhada). */
export interface ColaboradorFilialSummary {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  empresa?: ColaboradorEmpresaSummary | null;
}

export interface Colaborador {
  id?: string;
  filial_id: string;
  nome: string;
  email: string | null;
  filial?: ColaboradorFilialSummary | null;
  created_at?: string | null;
  updated_at?: string | null;
}

type ColaboradorRow = Omit<Colaborador, 'filial'> & {
  filial?: RawFilial[] | RawFilial | null;
};

type RawFilial = Omit<ColaboradorFilialSummary, 'empresa'> & {
  empresa?: ColaboradorEmpresaSummary[] | ColaboradorEmpresaSummary | null;
};

export type ColaboradorPayload = Omit<
  Colaborador,
  'id' | 'filial' | 'created_at' | 'updated_at'
>;

@Injectable({
  providedIn: 'root'
})
export class ColaboradorService {
  private readonly table = 'colaborador';

  private readonly selectColumns = `
    id,
    filial_id,
    nome,
    email,
    created_at,
    updated_at,
    filial:filial(
      id,
      nome_fantasia,
      razao_social,
      empresa:empresa(id, nome)
    )
  `;

  constructor(private readonly supabaseService: SupabaseService) {}

  async getAll(): Promise<Colaborador[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select(this.selectColumns)
      .order('nome', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item) => this.mapColaborador(item as ColaboradorRow));
  }

  async create(payload: ColaboradorPayload): Promise<Colaborador> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .insert({
        ...payload,
        created_at: now,
        updated_at: now
      })
      .select(this.selectColumns)
      .single();

    if (error) {
      throw error;
    }

    return this.mapColaborador(data as ColaboradorRow);
  }

  async update(id: string, payload: ColaboradorPayload): Promise<Colaborador> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(this.selectColumns)
      .single();

    if (error) {
      throw error;
    }

    return this.mapColaborador(data as ColaboradorRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /** Normaliza os relacionamentos (Supabase pode retornar objeto ou array). */
  private mapColaborador(item: ColaboradorRow): Colaborador {
    const rawFilial = Array.isArray(item.filial) ? item.filial[0] || null : item.filial || null;

    let filial: ColaboradorFilialSummary | null = null;
    if (rawFilial) {
      const rawEmpresa = Array.isArray(rawFilial.empresa)
        ? rawFilial.empresa[0] || null
        : rawFilial.empresa || null;

      filial = {
        id: rawFilial.id,
        nome_fantasia: rawFilial.nome_fantasia,
        razao_social: rawFilial.razao_social,
        empresa: rawEmpresa
      };
    }

    return {
      ...item,
      filial
    };
  }
}
