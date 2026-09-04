import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface OpcaoRespostaNr1 {
  id?: string;
  pergunta_id: string;
  texto: string;
  ordem: number;
  peso: number;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Item usado para persistir as opções de resposta de uma pergunta. */
export interface OpcaoRespostaItemPayload {
  texto: string;
  ordem: number;
  peso: number;
}

@Injectable({
  providedIn: 'root'
})
export class OpcaoRespostaNr1Service {
  private readonly table = 'opcao_resposta_nr1';

  private readonly selectColumns = 'id, pergunta_id, texto, ordem, peso, created_at, updated_at';

  constructor(private readonly supabaseService: SupabaseService) {}

  /** Lista as opções de resposta de uma pergunta (ordenadas). */
  async getByPergunta(perguntaId: string): Promise<OpcaoRespostaNr1[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select(this.selectColumns)
      .eq('pergunta_id', perguntaId)
      .order('ordem', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return (data || []) as OpcaoRespostaNr1[];
  }

  /**
   * Sincroniza as opções de uma pergunta: remove as atuais e reinsere a lista
   * informada. Consistente para edição de 1..n itens.
   */
  async syncByPergunta(perguntaId: string, itens: OpcaoRespostaItemPayload[]): Promise<void> {
    const { error: deleteError } = await this.supabaseService.client
      .from(this.table)
      .delete()
      .eq('pergunta_id', perguntaId);

    if (deleteError) {
      throw deleteError;
    }

    const validos = itens.filter((item) => item.texto?.trim());

    if (validos.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const rows = validos.map((item, index) => ({
      pergunta_id: perguntaId,
      texto: item.texto.trim(),
      ordem: item.ordem != null ? item.ordem : index + 1,
      peso: item.peso != null ? item.peso : 0,
      created_at: now,
      updated_at: now
    }));

    const { error: insertError } = await this.supabaseService.client
      .from(this.table)
      .insert(rows);

    if (insertError) {
      throw insertError;
    }
  }
}
