import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

/** Opção de resposta aninhada retornada junto da pergunta. */
export interface OpcaoRespostaNr1Nested {
  id?: string;
  pergunta_id?: string;
  texto: string;
  ordem: number;
  peso: number;
}

export interface PerguntaNr1 {
  id?: string;
  texto: string;
  ordem: number;
  fator_risco: string | null;
  opcoes_resposta?: OpcaoRespostaNr1Nested[];
  created_at?: string | null;
  updated_at?: string | null;
}

export type PerguntaNr1Payload = Pick<PerguntaNr1, 'texto' | 'ordem' | 'fator_risco'>;

type PerguntaNr1Row = Omit<PerguntaNr1, 'opcoes_resposta'> & {
  opcoes_resposta?: OpcaoRespostaNr1Nested[] | null;
};

@Injectable({
  providedIn: 'root'
})
export class PerguntaNr1Service {
  private readonly table = 'perguntas_nr1';

  private readonly selectColumns = `
    id,
    texto,
    ordem,
    fator_risco,
    created_at,
    updated_at,
    opcoes_resposta:opcao_resposta_nr1(id, pergunta_id, texto, ordem, peso)
  `;

  constructor(private readonly supabaseService: SupabaseService) {}

  async getAll(): Promise<PerguntaNr1[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select(this.selectColumns)
      .order('ordem', { ascending: true, nullsFirst: false })
      .order('ordem', { ascending: true, nullsFirst: false, referencedTable: 'opcao_resposta_nr1' });

    if (error) {
      throw error;
    }

    return (data || []).map((item) => this.mapPergunta(item as PerguntaNr1Row));
  }

  async create(payload: PerguntaNr1Payload): Promise<PerguntaNr1> {
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

    return this.mapPergunta(data as PerguntaNr1Row);
  }

  async update(id: string, payload: PerguntaNr1Payload): Promise<PerguntaNr1> {
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

    return this.mapPergunta(data as PerguntaNr1Row);
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

  /** Retorna a próxima ordem sugerida (maior ordem + 1) para novas perguntas. */
  async getProximaOrdem(): Promise<number> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select('ordem')
      .order('ordem', { ascending: false, nullsFirst: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const maiorOrdem = data && data.length > 0 ? Number((data[0] as { ordem: number }).ordem) : 0;
    return (Number.isFinite(maiorOrdem) ? maiorOrdem : 0) + 1;
  }

  private mapPergunta(item: PerguntaNr1Row): PerguntaNr1 {
    return {
      ...item,
      opcoes_resposta: Array.isArray(item.opcoes_resposta) ? item.opcoes_resposta : []
    };
  }
}
