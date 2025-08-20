import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Pergunta {
  id?: number;
  titulo: string;
  descricao: string;
  criado_em?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PerguntasService {
  private table = 'perguntas';

  constructor(private supabaseService: SupabaseService) {}

  async getAll(): Promise<Pergunta[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getById(id: number): Promise<Pergunta | null> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(pergunta: Pergunta): Promise<Pergunta> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .insert(pergunta)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: number, pergunta: Partial<Pergunta>): Promise<Pergunta> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .update(pergunta)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
