import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AplicacaoNr1FilialSummary {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  empresa?: { id: string; nome: string } | null;
}

export interface AplicacaoNr1RefSummary {
  id: string;
  nome: string;
}

export interface AplicacaoNr1 {
  id?: string;
  filial_id: string;
  setor_id: string | null;
  cargo_id: string | null;
  nome: string;
  status: string;
  filial?: AplicacaoNr1FilialSummary | null;
  setor?: AplicacaoNr1RefSummary | null;
  cargo?: AplicacaoNr1RefSummary | null;
  /** Total de tokens (colaboradores) gerados para o lote. */
  total_tokens?: number;
  /** Total de tokens já respondidos. */
  total_respondidos?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Parâmetros para a RPC de geração do lote + tokens. */
export interface GerarAplicacaoParams {
  nome: string;
  filial_id: string;
  quantidade_colaboradores: number;
  setor_id?: string | null;
  cargo_id?: string | null;
  status?: string;
}

/** Resultado retornado pela RPC gerar_aplicacao_com_tokens. */
export interface GerarAplicacaoResultado {
  aplicacao_id: string;
  nome: string;
  status: string;
  total_tokens: number;
}

type RawEmpresa = { id: string; nome: string };

type RawFilial = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  empresa?: RawEmpresa[] | RawEmpresa | null;
};

type AplicacaoNr1Row = Omit<AplicacaoNr1, 'filial' | 'setor' | 'cargo' | 'total_tokens' | 'total_respondidos'> & {
  filial?: RawFilial[] | RawFilial | null;
  setor?: AplicacaoNr1RefSummary[] | AplicacaoNr1RefSummary | null;
  cargo?: AplicacaoNr1RefSummary[] | AplicacaoNr1RefSummary | null;
  aplicacao_anonimo_nr1?: { respondido: boolean | null }[] | null;
};

@Injectable({
  providedIn: 'root'
})
export class AplicacaoNr1Service {
  private readonly table = 'aplicacao_nr1';

  private readonly selectColumns = `
    id,
    filial_id,
    setor_id,
    cargo_id,
    nome,
    status,
    created_at,
    updated_at,
    filial:filial(id, nome_fantasia, razao_social, empresa:empresa(id, nome)),
    setor:setor(id, nome),
    cargo:cargo(id, nome),
    aplicacao_anonimo_nr1(respondido)
  `;

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Chama a RPC transacional que cria o lote de aplicação e gera N tokens
   * anônimos de acesso. Retorna o resumo (id, nome, status, total de tokens).
   */
  async gerarAplicacaoComTokens(params: GerarAplicacaoParams): Promise<GerarAplicacaoResultado> {
    const { data, error } = await this.supabaseService.client.rpc('gerar_aplicacao_com_tokens', {
      p_nome: params.nome,
      p_filial_id: params.filial_id,
      p_quantidade_colaboradores: params.quantidade_colaboradores,
      p_setor_id: params.setor_id ?? null,
      p_cargo_id: params.cargo_id ?? null,
      p_status: params.status ?? 'GERADO'
    });

    if (error) {
      throw error;
    }

    // A RPC (RETURNS TABLE) retorna um array de linhas; pegamos a primeira.
    const row = Array.isArray(data) ? data[0] : data;

    return {
      aplicacao_id: row?.aplicacao_id,
      nome: row?.nome,
      status: row?.status,
      total_tokens: Number(row?.total_tokens ?? 0)
    };
  }

  async getAll(): Promise<AplicacaoNr1[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.table)
      .select(this.selectColumns)
      .order('created_at', { ascending: false, nullsFirst: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item) => this.mapAplicacao(item as unknown as AplicacaoNr1Row));
  }

  private mapAplicacao(item: AplicacaoNr1Row): AplicacaoNr1 {
    const rawFilial = Array.isArray(item.filial) ? item.filial[0] || null : item.filial || null;
    const setor = Array.isArray(item.setor) ? item.setor[0] || null : item.setor || null;
    const cargo = Array.isArray(item.cargo) ? item.cargo[0] || null : item.cargo || null;

    // desaninha a empresa dentro da filial (Supabase pode retornar objeto ou array)
    let filial: AplicacaoNr1FilialSummary | null = null;
    if (rawFilial) {
      const rawEmpresa = Array.isArray(rawFilial.empresa)
        ? rawFilial.empresa[0] || null
        : rawFilial.empresa || null;

      filial = {
        id: rawFilial.id,
        nome_fantasia: rawFilial.nome_fantasia,
        razao_social: rawFilial.razao_social,
        empresa: rawEmpresa
      };
    }

    const tokens = Array.isArray(item.aplicacao_anonimo_nr1) ? item.aplicacao_anonimo_nr1 : [];
    const totalTokens = tokens.length;
    const totalRespondidos = tokens.filter((t) => t.respondido).length;

    return {
      id: item.id,
      filial_id: item.filial_id,
      setor_id: item.setor_id,
      cargo_id: item.cargo_id,
      nome: item.nome,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      filial,
      setor,
      cargo,
      total_tokens: totalTokens,
      total_respondidos: totalRespondidos
    };
  }
}
