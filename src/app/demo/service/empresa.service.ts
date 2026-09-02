import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Empresa {
  id?: string;
  nome: string;
  data_fundacao: string | null;
  email: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type EmpresaPayload = Omit<Empresa, 'id' | 'created_at' | 'updated_at'>;

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private readonly table = 'empresa';

  constructor(private readonly supabaseService: SupabaseService) {}

  async getAll(): Promise<Empresa[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select('id, nome, data_fundacao, email, created_at, updated_at')
      .order('nome', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  async create(payload: EmpresaPayload): Promise<Empresa> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .insert({
        ...payload,
        created_at: now,
        updated_at: now
      })
      .select('id, nome, data_fundacao, email, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async update(id: string, payload: EmpresaPayload): Promise<Empresa> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, nome, data_fundacao, email, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return data;
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
}
