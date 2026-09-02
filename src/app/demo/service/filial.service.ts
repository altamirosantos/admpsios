import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface FilialEmpresaSummary {
  id: string;
  nome: string;
}

export interface Filial {
  id?: string;
  empresa_id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  data_fundacao: string | null;
  cnpj: string | null;
  email: string | null;
  empresa?: FilialEmpresaSummary | null;
  created_at?: string | null;
  updated_at?: string | null;
}

type FilialRow = Omit<Filial, 'empresa'> & {
  empresa?: FilialEmpresaSummary[] | FilialEmpresaSummary | null;
};

export type FilialPayload = Omit<Filial, 'id' | 'empresa' | 'created_at' | 'updated_at'>;

@Injectable({
  providedIn: 'root'
})
export class FilialService {
  private readonly table = 'filial';

  private readonly selectColumns = `
    id,
    empresa_id,
    razao_social,
    nome_fantasia,
    data_fundacao,
    cnpj,
    email,
    created_at,
    updated_at,
    empresa:empresa(id, nome)
  `;

  constructor(private readonly supabaseService: SupabaseService) {}

  async getAll(): Promise<Filial[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select(this.selectColumns)
      .order('nome_fantasia', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item) => this.mapFilial(item as FilialRow));
  }

  async create(payload: FilialPayload): Promise<Filial> {
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

    return this.mapFilial(data as FilialRow);
  }

  async update(id: string, payload: FilialPayload): Promise<Filial> {
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

    return this.mapFilial(data as FilialRow);
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

  private mapFilial(item: FilialRow): Filial {
    const relatedEmpresa = Array.isArray(item.empresa)
      ? item.empresa[0] || null
      : item.empresa || null;

    return {
      ...item,
      empresa: relatedEmpresa
    };
  }
}
