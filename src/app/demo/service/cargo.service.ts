import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface CargoEmpresaSummary {
  id: string;
  nome: string;
}

export interface Cargo {
  id?: string;
  empresa_id: string;
  nome: string;
  empresa?: CargoEmpresaSummary | null;
  created_at?: string | null;
  updated_at?: string | null;
}

type CargoRow = Omit<Cargo, 'empresa'> & {
  empresa?: CargoEmpresaSummary[] | CargoEmpresaSummary | null;
};

export type CargoPayload = Omit<Cargo, 'id' | 'empresa' | 'created_at' | 'updated_at'>;

@Injectable({
  providedIn: 'root'
})
export class CargoService {
  private readonly table = 'cargo';

  private readonly selectColumns = `
    id,
    empresa_id,
    nome,
    created_at,
    updated_at,
    empresa:empresa(id, nome)
  `;

  constructor(private readonly supabaseService: SupabaseService) {}

  async getAll(): Promise<Cargo[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select(this.selectColumns)
      .order('nome', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item) => this.mapCargo(item as CargoRow));
  }

  async create(payload: CargoPayload): Promise<Cargo> {
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

    return this.mapCargo(data as CargoRow);
  }

  async update(id: string, payload: CargoPayload): Promise<Cargo> {
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

    return this.mapCargo(data as CargoRow);
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

  private mapCargo(item: CargoRow): Cargo {
    const relatedEmpresa = Array.isArray(item.empresa)
      ? item.empresa[0] || null
      : item.empresa || null;

    return {
      ...item,
      empresa: relatedEmpresa
    };
  }
}
