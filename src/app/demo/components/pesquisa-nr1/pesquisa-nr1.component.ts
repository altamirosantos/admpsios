import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
    PerguntaPublica,
    PesquisaNr1Service,
    RespostaItem,
    SituacaoToken
} from 'src/app/demo/service/pesquisa-nr1.service';

type Tela = 'CARREGANDO' | 'INVALIDO' | 'RESPONDIDO' | 'INDISPONIVEL' | 'QUESTIONARIO' | 'AGRADECIMENTO' | 'ERRO';

@Component({
    selector: 'app-pesquisa-nr1',
    templateUrl: './pesquisa-nr1.component.html',
    styleUrl: './pesquisa-nr1.component.scss'
})
export class PesquisaNr1Component implements OnInit {
    tela: Tela = 'CARREGANDO';

    token = '';
    nomeAplicacao: string | null = null;
    perguntas: PerguntaPublica[] = [];

    /** Índice da pergunta atual (0-based). */
    indiceAtual = 0;

    /** Mapa pergunta_id -> opcao_id selecionada. */
    respostas: Record<string, string> = {};

    enviando = false;
    mensagemErro = '';

    constructor(
        private readonly route: ActivatedRoute,
        private readonly pesquisaService: PesquisaNr1Service
    ) {}

    ngOnInit(): void {
        this.token = (this.route.snapshot.paramMap.get('token') || '').trim();
        void this.carregar();
    }

    private async carregar(): Promise<void> {
        this.tela = 'CARREGANDO';

        try {
            const resultado = await this.pesquisaService.carregarPorToken(this.token);
            this.nomeAplicacao = resultado.nomeAplicacao;
            this.perguntas = resultado.perguntas;
            this.tela = this.telaPorSituacao(resultado.situacao);
        } catch (error) {
            console.error('Erro ao carregar questionário NR-1:', error);
            this.tela = 'ERRO';
        }
    }

    private telaPorSituacao(situacao: SituacaoToken): Tela {
        if (situacao === 'RESPONDIDO') {
            return 'RESPONDIDO';
        }
        if (situacao === 'INDISPONIVEL') {
            return 'INDISPONIVEL';
        }
        if (situacao === 'VALIDO' && this.perguntas.length > 0) {
            return 'QUESTIONARIO';
        }
        return 'INVALIDO';
    }

    // --- Estado da pergunta atual ---

    get perguntaAtual(): PerguntaPublica | null {
        return this.perguntas[this.indiceAtual] ?? null;
    }

    get totalPerguntas(): number {
        return this.perguntas.length;
    }

    get numeroAtual(): number {
        return this.indiceAtual + 1;
    }

    get progresso(): number {
        if (this.totalPerguntas === 0) {
            return 0;
        }
        return Math.round((this.respondidasCount / this.totalPerguntas) * 100);
    }

    get respondidasCount(): number {
        return Object.keys(this.respostas).length;
    }

    get ehUltima(): boolean {
        return this.indiceAtual === this.totalPerguntas - 1;
    }

    get ehPrimeira(): boolean {
        return this.indiceAtual === 0;
    }

    /** Opção selecionada para a pergunta atual (se houver). */
    get opcaoSelecionadaAtual(): string | null {
        const pergunta = this.perguntaAtual;
        return pergunta ? this.respostas[pergunta.id] ?? null : null;
    }

    /** Todas as perguntas obrigatórias foram respondidas? */
    get todasObrigatoriasRespondidas(): boolean {
        return this.perguntas
            .filter((p) => p.obrigatoria)
            .every((p) => !!this.respostas[p.id]);
    }

    // --- Interação ---

    selecionarOpcao(perguntaId: string, opcaoId: string): void {
        this.respostas = { ...this.respostas, [perguntaId]: opcaoId };

        // Auto-avança para a próxima pergunta (reduz toques no celular),
        // exceto na última — lá o usuário revisa e envia.
        if (!this.ehUltima) {
            window.setTimeout(() => this.proxima(), 260);
        }
    }

    ehSelecionada(perguntaId: string, opcaoId: string): boolean {
        return this.respostas[perguntaId] === opcaoId;
    }

    proxima(): void {
        if (this.indiceAtual < this.totalPerguntas - 1) {
            this.indiceAtual++;
            this.rolarTopo();
        }
    }

    anterior(): void {
        if (this.indiceAtual > 0) {
            this.indiceAtual--;
            this.rolarTopo();
        }
    }

    private rolarTopo(): void {
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            window.scrollTo(0, 0);
        }
    }

    /**
     * Retorna uma classe de cor por posição da opção (escala Likert visual):
     * verde (positivo) -> vermelho (negativo). Baseada na ordem/quantidade.
     */
    corEscala(pergunta: PerguntaPublica, index: number): string {
        const total = pergunta.opcoes.length;
        if (total <= 1) {
            return 'escala-neutra';
        }
        // 5 faixas de cor distribuídas conforme a posição relativa
        const proporcao = index / (total - 1);
        if (proporcao <= 0.2) return 'escala-1';
        if (proporcao <= 0.4) return 'escala-2';
        if (proporcao <= 0.6) return 'escala-3';
        if (proporcao <= 0.8) return 'escala-4';
        return 'escala-5';
    }

    async enviar(): Promise<void> {
        if (!this.todasObrigatoriasRespondidas || this.enviando) {
            return;
        }

        this.enviando = true;
        this.mensagemErro = '';

        const payload: RespostaItem[] = Object.entries(this.respostas).map(([pergunta_id, opcao_id]) => ({
            pergunta_id,
            opcao_id
        }));

        try {
            await this.pesquisaService.submeterRespostas(this.token, payload);
            this.tela = 'AGRADECIMENTO';
            this.rolarTopo();
        } catch (error: unknown) {
            console.error('Erro ao enviar respostas NR-1:', error);
            const msg = (error as { message?: string })?.message || '';
            // se o token já foi respondido nesse meio-tempo, mostra a tela adequada
            if (/respondido/i.test(msg)) {
                this.tela = 'RESPONDIDO';
            } else if (/ativa|indispon|encerrad|liberad/i.test(msg)) {
                this.tela = 'INDISPONIVEL';
            } else {
                this.mensagemErro = 'Não foi possível enviar suas respostas. Verifique sua conexão e tente novamente.';
            }
        } finally {
            this.enviando = false;
        }
    }
}
