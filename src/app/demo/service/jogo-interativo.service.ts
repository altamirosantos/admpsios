import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface JogoInterativo {
  id?: number;
  nome: string;
  titulo: string;
  created_at?: string;
}

export interface QuestaoInterativa {
  id?: number;
  jogo_interativo_id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string | null;
  insight?: string | null;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JogoInterativoService {
  private readonly jogosTable = 'jogo_interativo';
  private readonly questoesTable = 'questoes_interativo';

  constructor(private readonly supabaseService: SupabaseService) {}

  async getJogos(): Promise<JogoInterativo[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.jogosTable)
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createJogo(payload: JogoInterativo): Promise<JogoInterativo> {
    const { data, error } = await this.supabaseService.client
      .from(this.jogosTable)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateJogo(id: number, payload: Partial<JogoInterativo>): Promise<JogoInterativo> {
    const { data, error } = await this.supabaseService.client
      .from(this.jogosTable)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteJogo(id: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.jogosTable)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getQuestoesByJogoId(jogoId: number): Promise<QuestaoInterativa[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.questoesTable)
      .select('*')
      .eq('jogo_interativo_id', jogoId)
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createQuestao(payload: QuestaoInterativa): Promise<QuestaoInterativa> {
    const { data, error } = await this.supabaseService.client
      .from(this.questoesTable)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateQuestao(id: number, payload: Partial<QuestaoInterativa>): Promise<QuestaoInterativa> {
    const { data, error } = await this.supabaseService.client
      .from(this.questoesTable)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteQuestao(id: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.questoesTable)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
