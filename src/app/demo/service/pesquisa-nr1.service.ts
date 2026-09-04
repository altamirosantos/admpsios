import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type TipoResposta = 'LIKERT_5' | 'LIKERT_3' | 'BOOLEANO' | 'NOMINAL_MULTIPLO' | 'TEXTO_LIVRE';

export interface OpcaoRespostaPublica {
  id: string;
  texto: string;
  ordem: number;
  peso: number;
}

export interface PerguntaPublica {
  id: string;
  texto: string;
  ordem: number;
  fator_risco: string | null;
  obrigatoria: boolean;
  tipo_resposta: TipoResposta;
  opcoes: OpcaoRespostaPublica[];
}

/** Situação do token consultado. */
export type SituacaoToken = 'VALIDO' | 'INVALIDO' | 'RESPONDIDO' | 'INDISPONIVEL';

export interface QuestionarioPublico {
  situacao: SituacaoToken;
  /** Nome do lote de aplicação (título exibido no cabeçalho). */
  nomeAplicacao: string | null;
  perguntas: PerguntaPublica[];
}

export interface RespostaItem {
  pergunta_id: string;
  opcao_id: string;
}

/** Forma bruta do registro anônimo retornado pelo Supabase (relacionamento pode ser objeto ou array). */
type AplicacaoResumo = { id: string; nome: string; status: string };
interface AnonimoRow {
  id: string;
  respondido: boolean;
  aplicacao_nr1: AplicacaoResumo[] | AplicacaoResumo | null;
}

@Injectable({
  providedIn: 'root'
})
export class PesquisaNr1Service {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Valida o token e, se válido, carrega o questionário (perguntas + opções
   * ordenadas). Retorna a situação (VALIDO | INVALIDO | RESPONDIDO).
   */
  async carregarPorToken(token: string): Promise<QuestionarioPublico> {
    const vazio: QuestionarioPublico = { situacao: 'INVALIDO', nomeAplicacao: null, perguntas: [] };

    if (!token || !this.isUuid(token)) {
      return vazio;
    }

    // 1) valida o token e obtém o lote da aplicação
    const { data: anonimo, error: anonimoError } = await this.supabaseService.client
      .from('aplicacao_anonimo_nr1')
      .select('id, respondido, aplicacao_nr1:aplicacao_nr1(id, nome, status)')
      .eq('token', token)
      .maybeSingle();

    if (anonimoError) {
      throw anonimoError;
    }

    if (!anonimo) {
      return vazio;
    }

    // Supabase pode retornar o relacionamento como objeto ou array; normalizamos.
    const anonimoRow = anonimo as unknown as AnonimoRow;
    const aplicacao = Array.isArray(anonimoRow.aplicacao_nr1)
      ? anonimoRow.aplicacao_nr1[0] ?? null
      : anonimoRow.aplicacao_nr1 ?? null;

    if (anonimoRow.respondido) {
      return { situacao: 'RESPONDIDO', nomeAplicacao: aplicacao?.nome ?? null, perguntas: [] };
    }

    // Só é possível responder enquanto a aplicação estiver ATIVA
    // (ainda não liberada / prazo encerrado => indisponível).
    if ((aplicacao?.status ?? '').toUpperCase() !== 'ATIVO') {
      return { situacao: 'INDISPONIVEL', nomeAplicacao: aplicacao?.nome ?? null, perguntas: [] };
    }

    // 2) carrega as perguntas e opções ordenadas
    const { data: perguntas, error: perguntasError } = await this.supabaseService.client
      .from('perguntas_nr1')
      .select('id, texto, ordem, fator_risco, obrigatoria, tipo_resposta, opcoes:opcao_resposta_nr1(id, texto, ordem, peso)')
      .order('ordem', { ascending: true })
      .order('ordem', { ascending: true, referencedTable: 'opcao_resposta_nr1' });

    if (perguntasError) {
      throw perguntasError;
    }

    const perguntasMapeadas: PerguntaPublica[] = (perguntas || []).map((p) => {
      const item = p as PerguntaPublica & { opcoes: OpcaoRespostaPublica[] | null };
      return {
        id: item.id,
        texto: item.texto,
        ordem: item.ordem,
        fator_risco: item.fator_risco,
        obrigatoria: item.obrigatoria,
        tipo_resposta: item.tipo_resposta,
        opcoes: Array.isArray(item.opcoes) ? item.opcoes : []
      };
    });

    return {
      situacao: 'VALIDO',
      nomeAplicacao: aplicacao?.nome ?? null,
      perguntas: perguntasMapeadas
    };
  }

  /**
   * Submete as respostas via RPC transacional. Lança erro (com mensagem
   * amigável) caso o token já tenha sido respondido ou seja inválido.
   */
  async submeterRespostas(token: string, respostas: RespostaItem[]): Promise<number> {
    const { data, error } = await this.supabaseService.client.rpc('submeter_resposta_nr1_anonima', {
      p_token: token,
      p_respostas: respostas
    });

    if (error) {
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return Number(row?.total_itens ?? 0);
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
  }
}
