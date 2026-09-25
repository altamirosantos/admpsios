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

/** Opção de setor/cargo (lista pré-cadastrada da empresa da aplicação). */
export interface OpcaoIdentificacao {
  id: string;
  nome: string;
}

export interface QuestionarioPublico {
  situacao: SituacaoToken;
  /** Nome do lote de aplicação (título exibido no cabeçalho). */
  nomeAplicacao: string | null;
  perguntas: PerguntaPublica[];
  /** Setores da empresa da aplicação (para o colaborador escolher). */
  setores: OpcaoIdentificacao[];
  /** Cargos da empresa da aplicação (para o colaborador escolher). */
  cargos: OpcaoIdentificacao[];
  /** Link do YouTube do vídeo explicativo (ou null). */
  videoUrl: string | null;
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
    const vazio: QuestionarioPublico = { situacao: 'INVALIDO', nomeAplicacao: null, perguntas: [], setores: [], cargos: [], videoUrl: null };

    if (!token || !this.isUuid(token)) {
      return vazio;
    }

    // 1) valida o token e obtém o lote da aplicação (com a empresa via filial)
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
      return { situacao: 'RESPONDIDO', nomeAplicacao: aplicacao?.nome ?? null, perguntas: [], setores: [], cargos: [], videoUrl: null };
    }

    // Só é possível responder enquanto a aplicação estiver ATIVA
    // (ainda não liberada / prazo encerrado => indisponível).
    if ((aplicacao?.status ?? '').toUpperCase() !== 'ATIVO') {
      return { situacao: 'INDISPONIVEL', nomeAplicacao: aplicacao?.nome ?? null, perguntas: [], setores: [], cargos: [], videoUrl: null };
    }

    // Setores/cargos + vídeo da aplicação (via RPC security definer, sem depender de RLS).
    const { setores, cargos, videoUrl } = await this.carregarSetoresCargos(token);

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
      perguntas: perguntasMapeadas,
      setores,
      cargos,
      videoUrl
    };
  }

  /**
   * Carrega setores e cargos via RPC security definer (a partir do token),
   * evitando dependência de policies de leitura anônima nas tabelas.
   */
  private async carregarSetoresCargos(
    token: string
  ): Promise<{ setores: OpcaoIdentificacao[]; cargos: OpcaoIdentificacao[]; videoUrl: string | null }> {
    const { data, error } = await this.supabaseService.client.rpc('listar_setores_cargos_por_token', {
      p_token: token
    });

    if (error) {
      throw error;
    }

    const payload = (data ?? {}) as {
      setores?: OpcaoIdentificacao[];
      cargos?: OpcaoIdentificacao[];
      video_url?: string | null;
    };
    return {
      setores: Array.isArray(payload.setores) ? payload.setores : [],
      cargos: Array.isArray(payload.cargos) ? payload.cargos : [],
      videoUrl: payload.video_url ?? null
    };
  }

  /**
   * Submete as respostas via RPC transacional. Lança erro (com mensagem
   * amigável) caso o token já tenha sido respondido ou seja inválido.
   */
  async submeterRespostas(
    token: string,
    respostas: RespostaItem[],
    setorId: string,
    cargoId: string | null
  ): Promise<number> {
    const { data, error } = await this.supabaseService.client.rpc('submeter_resposta_nr1_anonima', {
      p_token: token,
      p_respostas: respostas,
      p_setor_id: setorId,
      p_cargo_id: cargoId
    });

    if (error) {
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return Number(row?.total_itens ?? 0);
  }

  /**
   * Valida e vincula um CPF ao acesso da aplicação NR-1, ou recupera um acesso
   * em progresso. Chamado na etapa intermediária (antes do questionário).
   *
   * Retorna um objeto com:
   *   - status: 'sucesso' | 'respondido' | 'sem_tokens' | 'aplicacao_inativa' | 'erro'
   *   - token: o token do questionário (se sucesso ou recuperação)
   *   - session_id: o ID da sessão gerado
   *   - mensagem: descrição do resultado
   */
  async vincularOuRecuperarTokenNr1(
    aplicacaoNr1Id: string,
    cpf: string
  ): Promise<{
    status: 'sucesso' | 'respondido' | 'sem_tokens' | 'aplicacao_inativa' | 'erro';
    token: string | null;
    session_id: string | null;
    mensagem: string;
  }> {
    // Validações básicas
    if (!aplicacaoNr1Id || !this.isUuid(aplicacaoNr1Id)) {
      return {
        status: 'erro',
        token: null,
        session_id: null,
        mensagem: 'ID da aplicação inválido.'
      };
    }

    // Valida e limpa o CPF
    const cpfLimpo = this.normalizarCpf(cpf);
    if (!this.validarCpf(cpfLimpo)) {
      return {
        status: 'erro',
        token: null,
        session_id: null,
        mensagem: 'CPF inválido. Verifique o número e tente novamente.'
      };
    }

    // Chama a RPC
    const { data, error } = await this.supabaseService.client.rpc('vincular_ou_recuperar_token_nr1', {
      p_aplicacao_nr1_id: aplicacaoNr1Id,
      p_cpf: cpfLimpo
    });

    if (error) {
      console.error('Erro ao chamar RPC:', error);
      return {
        status: 'erro',
        token: null,
        session_id: null,
        mensagem: 'Erro ao processar sua requisição. Tente novamente.'
      };
    }

    const resultado = (data ?? {}) as {
      status: string;
      token: string | null;
      session_id: string | null;
      mensagem: string;
    };

    return {
      status: resultado.status as 'sucesso' | 'respondido' | 'sem_tokens' | 'aplicacao_inativa' | 'erro',
      token: resultado.token,
      session_id: resultado.session_id,
      mensagem: resultado.mensagem
    };
  }

  /**
   * Normaliza o CPF removendo caracteres especiais.
   */
  private normalizarCpf(cpf: string): string {
    return (cpf ?? '').replace(/\D/g, '');
  }

  /**
   * Valida o CPF usando o algoritmo dos dígitos verificadores.
   * Retorna false se:
   *   - Não contém 11 dígitos
   *   - É composto de dígitos repetidos (ex: 111.111.111-11)
   *   - Os dígitos verificadores estão incorretos
   */
  private validarCpf(cpf: string): boolean {
    const cpfLimpo = this.normalizarCpf(cpf);

    // Deve ter exatamente 11 dígitos
    if (cpfLimpo.length !== 11 || !/^\d+$/.test(cpfLimpo)) {
      return false;
    }

    // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cpfLimpo)) {
      return false;
    }

    // Calcula o primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += Number(cpfLimpo[i]) * (10 - i);
    }
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;

    // Calcula o segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += Number(cpfLimpo[i]) * (11 - i);
    }
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;

    // Verifica se os dígitos calculados correspondem aos informados
    return Number(cpfLimpo[9]) === digito1 && Number(cpfLimpo[10]) === digito2;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
  }
}
