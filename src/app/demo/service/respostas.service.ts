import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class RespostasService {
  private table = 'respostas';

  constructor(private supabaseService: SupabaseService) {}

  async getAll() {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .select('*, perguntas(*)'); // opcional: traz a pergunta vinculada
    if (error) throw error;
    return data;
  }

  async getById(id: number) {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .select('*, perguntas(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async getByPerguntaId(perguntaId: number) {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .select('*')
      .eq('pergunta_id', perguntaId)
      .order('id', { ascending: true });
    if (error) throw error;
    return data;
  }

  async create(resposta: { descricao: string; devolutiva:string; pergunta_id: string }) {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .insert(resposta)
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, resposta: Partial<{ devolutiva: string }>) {
    const { data, error } = await this.supabaseService['supabase']
      .from(this.table)
      .update(resposta)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: number) {
    const { error } = await this.supabaseService['supabase']
      .from(this.table)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
