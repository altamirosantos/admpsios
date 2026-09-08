import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

/** Classificação qualitativa (gravidade / probabilidade). */
export type ClasseNivel = 'Baixa' | 'Média' | 'Alta';

/** Classificação final da matriz de risco NR-1. */
export type RiscoClasse = 'Baixo' | 'Médio' | 'Alto' | 'Crítico' | 'Pendente';

/**
 * Métrica de um fator de risco (tópico) do DRPS, já com o cruzamento
 * Gravidade x Probabilidade resolvido pela matriz de risco.
 */
export interface MetricaFatorRisco {
  fator_risco: string;
  total_respostas: number;
  /** Média simples da GravidadeNum das respostas do tópico (0..3). */
  gravidade_media: number;
  gravidade_classe: ClasseNivel;
  /** Gravidade convertida em nível (1..3) para a matriz. */
  gravidade_num: number;
  /** Probabilidade informada pelo psicólogo (1..3) ou null se pendente. */
  probabilidade: number | null;
  probabilidade_classe: ClasseNivel | null;
  /** Produto Gravidade x Probabilidade (1..9) ou null se pendente. */
  risco_num: number | null;
  risco_classe: RiscoClasse;
}

/** Resumo geral da aplicação (setor) além do detalhe por tópico. */
export interface ResumoMetricasNr1 {
  topicos: MetricaFatorRisco[];
  /** Média geral da gravidade (média das gravidades médias dos tópicos). */
  gravidadeGeral: number;
  gravidadeGeralClasse: ClasseNivel;
  /** Total de respostas consideradas no cálculo. */
  totalRespostas: number;
  /** Quantos tópicos ainda estão sem probabilidade informada. */
  topicosPendentes: number;
}

/** Setor com respostas em uma aplicação (para o filtro do dashboard). */
export interface SetorRespondido {
  setor_id: string;
  setor_nome: string;
  total_respondentes: number;
}

interface SetorRespondidoRow {
  setor_id: string;
  setor_nome: string;
  total_respondentes: number | string;
}

/** Linha bruta retornada pela RPC calcular_metricas_nr1. */
interface MetricaRow {
  fator_risco: string;
  total_respostas: number | string;
  gravidade_media: number | string | null;
  gravidade_classe: ClasseNivel;
  gravidade_num: number | string;
  probabilidade: number | string | null;
  probabilidade_classe: ClasseNivel | null;
  risco_num: number | string | null;
  risco_classe: RiscoClasse;
}

@Injectable({
  providedIn: 'root'
})
export class MetricasNr1Service {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Calcula as métricas do DRPS de uma aplicação (setor), reproduzindo as
   * regras da planilha. Retorna o detalhe por tópico + o resumo geral.
   */
  async calcularMetricas(aplicacaoId: string, setorId: string | null = null): Promise<ResumoMetricasNr1> {
    const { data, error } = await this.supabaseService.client.rpc('calcular_metricas_nr1', {
      p_aplicacao_id: aplicacaoId,
      p_setor_id: setorId
    });

    if (error) {
      throw error;
    }

    const topicos: MetricaFatorRisco[] = (data as MetricaRow[] | null ?? []).map((row) => ({
      fator_risco: row.fator_risco,
      total_respostas: this.toNumber(row.total_respostas),
      gravidade_media: this.toNumber(row.gravidade_media),
      gravidade_classe: row.gravidade_classe,
      gravidade_num: this.toNumber(row.gravidade_num),
      probabilidade: row.probabilidade == null ? null : this.toNumber(row.probabilidade),
      probabilidade_classe: row.probabilidade_classe,
      risco_num: row.risco_num == null ? null : this.toNumber(row.risco_num),
      risco_classe: row.risco_classe
    }));

    return this.montarResumo(topicos);
  }

  /**
   * Grava/atualiza a Probabilidade (1..3) de um tópico para a aplicação.
   * Após salvar, o chamador deve recalcular as métricas para refletir a matriz.
   */
  async salvarProbabilidade(
    aplicacaoId: string,
    fatorRisco: string,
    probabilidade: number,
    setorId: string | null = null
  ): Promise<void> {
    const { error } = await this.supabaseService.client.rpc('upsert_probabilidade_nr1', {
      p_aplicacao_id: aplicacaoId,
      p_fator_risco: fatorRisco,
      p_probabilidade: probabilidade,
      p_setor_id: setorId
    });

    if (error) {
      throw error;
    }
  }

  /** Lista os setores que possuem respostas na aplicação (para o filtro). */
  async listarSetores(aplicacaoId: string): Promise<SetorRespondido[]> {
    const { data, error } = await this.supabaseService.client.rpc('listar_setores_respondidos_nr1', {
      p_aplicacao_id: aplicacaoId
    });

    if (error) {
      throw error;
    }

    return (data || []).map((row: SetorRespondidoRow) => ({
      setor_id: row.setor_id,
      setor_nome: row.setor_nome,
      total_respondentes: this.toNumber(row.total_respondentes)
    }));
  }

  /** Monta o resumo geral a partir do detalhe por tópico. */
  private montarResumo(topicos: MetricaFatorRisco[]): ResumoMetricasNr1 {
    const totalRespostas = topicos.reduce((acc, t) => acc + t.total_respostas, 0);
    const topicosPendentes = topicos.filter((t) => t.probabilidade == null).length;

    // Média geral = média simples das gravidades médias dos tópicos com respostas.
    const comRespostas = topicos.filter((t) => t.total_respostas > 0);
    const gravidadeGeral = comRespostas.length
      ? this.arredondar(comRespostas.reduce((acc, t) => acc + t.gravidade_media, 0) / comRespostas.length)
      : 0;

    return {
      topicos,
      gravidadeGeral,
      gravidadeGeralClasse: this.classificarNivel(gravidadeGeral),
      totalRespostas,
      topicosPendentes
    };
  }

  /** Classifica uma média (0..3) em Baixa/Média/Alta — mesma regra do Resumo por Tópico. */
  private classificarNivel(media: number): ClasseNivel {
    if (media >= 2.5) {
      return 'Alta';
    }
    if (media >= 1.5) {
      return 'Média';
    }
    return 'Baixa';
  }

  private toNumber(value: number | string | null | undefined): number {
    const n = typeof value === 'string' ? Number(value) : value ?? 0;
    return Number.isFinite(n) ? (n as number) : 0;
  }

  private arredondar(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
