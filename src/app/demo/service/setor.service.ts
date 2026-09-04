import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface SetorEmpresaSummary {
  id: string;
  nome: string;
}

export interface Setor {
  id?: string;
  empresa_id: string;
  nome: string;
  empresa?: SetorEmpresaSummary | null;
  created_at?: string | null;
  updated_at?: string | null;
}

type SetorRow = Omit<Setor, 'empresa'> & {
  empresa?: SetorEmpresaSummary[] | SetorEmpresaSummary | null;
};

export type SetorPayload = Omit<Setor, 'id' | 'empresa' | 'created_at' | 'updated_at'>;

@Injectable({
  providedIn: 'root'
})
export class SetorService {
  private readonly table = 'setor';

  private readonly selectColumns = `
    id,
    empresa_id,
    nome,
    created_at,
    updated_at,
    empresa:empresa(id, nome)
  `;

  constructor(private readonly supabaseService: SupabaseService) {}

  async getAll(): Promise<Setor[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select(this.selectColumns)
      .order('nome', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item) => this.mapSetor(item as SetorRow));
  }

  async create(payload: SetorPayload): Promise<Setor> {
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

    return this.mapSetor(data as SetorRow);
  }

  async update(id: string, payload: SetorPayload): Promise<Setor> {
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

    return this.mapSetor(data as SetorRow);
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

  private mapSetor(item: SetorRow): Setor {
    const relatedEmpresa = Array.isArray(item.empresa)
      ? item.empresa[0] || null
      : item.empresa || null;

    return {
      ...item,
      empresa: relatedEmpresa
    };
  }
}
