import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

/** Status possíveis de um lote de aplicação NR-1. Apenas ATIVO libera o questionário. */
export type AplicacaoStatus = 'GERADO' | 'ATIVO' | 'ENCERRADO' | 'CANCELADO';

export const APLICACAO_STATUS: AplicacaoStatus[] = ['GERADO', 'ATIVO', 'ENCERRADO', 'CANCELADO'];

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
  dados_relatorio?: unknown | null;
  video_url?: string | null;
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
  /** Link do YouTube exibido ao colaborador antes do questionário. */
  video_url?: string | null;
}

/** Resultado retornado pela RPC gerar_aplicacao_com_tokens. */
export interface GerarAplicacaoResultado {
  aplicacao_id: string;
  nome: string;
  status: string;
  total_tokens: number;
}

/** Token de acesso de um colaborador dentro de uma aplicação. */
export interface TokenAplicacaoNr1 {
  id: string;
  token: string;
  respondido: boolean;
  email: string | null;
  colaborador_id: string | null;
  colaborador_nome: string | null;
}

/** Resultado do disparo de e-mails pela Edge Function. */
export interface EnvioLinksResultado {
  enviados: number;
  totalDestinatarios: number;
  semEmail: number;
  falhas: { email: string; erro: string }[];
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
    dados_relatorio,
    video_url,
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
      p_status: params.status ?? 'GERADO',
      p_video_url: params.video_url ?? null
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

  /**
   * Cria o lote e gera 1 token por colaborador cadastrado na filial, com
   * vínculo temporário (nome/e-mail) para o disparo. Setor/cargo são
   * informados depois pelo próprio colaborador no questionário.
   */
  async gerarAplicacaoPorColaboradores(
    nome: string,
    filialId: string,
    status: string = 'GERADO',
    videoUrl: string | null = null
  ): Promise<{ aplicacao_id: string; nome: string; status: string; total_tokens: number; total_sem_email: number }> {
    const { data, error } = await this.supabaseService.client.rpc('gerar_aplicacao_por_colaboradores', {
      p_nome: nome,
      p_filial_id: filialId,
      p_status: status,
      p_video_url: videoUrl
    });

    if (error) {
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
      aplicacao_id: row?.aplicacao_id,
      nome: row?.nome,
      status: row?.status,
      total_tokens: Number(row?.total_tokens ?? 0),
      total_sem_email: Number(row?.total_sem_email ?? 0)
    };
  }

  /** Lista os tokens (links) de uma aplicação, com o vínculo temporário. */
  async listarTokens(aplicacaoId: string): Promise<TokenAplicacaoNr1[]> {
    const { data, error } = await this.supabaseService.client.rpc('listar_tokens_aplicacao_nr1', {
      p_aplicacao_id: aplicacaoId
    });

    if (error) {
      throw error;
    }

    return (data || []) as TokenAplicacaoNr1[];
  }

  /**
   * Dispara os links por e-mail (Edge Function 'enviar-links-nr1').
   * base_url é a origem pública do app (ex.: https://admin.suaempresa.com).
   */
  async enviarLinksPorEmail(
    aplicacaoId: string,
    baseUrl: string,
    reenviar = false
  ): Promise<EnvioLinksResultado> {
    const { data, error } = await this.supabaseService.client.functions.invoke('enviar-links-nr1', {
      body: { aplicacao_id: aplicacaoId, base_url: baseUrl, reenviar }
    });

    if (error) {
      throw error;
    }

    return data as EnvioLinksResultado;
  }

  /** Atualiza apenas o status do lote (GERADO/ATIVO/ENCERRADO/CANCELADO). */
  async atualizarStatus(id: string, status: AplicacaoStatus): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.table)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async atualizarDadosRelatorio(id: string, dadosRelatorio: unknown): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.table)
      .update({ dados_relatorio: dadosRelatorio, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
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
      dados_relatorio: item.dados_relatorio ?? null,
      video_url: item.video_url ?? null,
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
