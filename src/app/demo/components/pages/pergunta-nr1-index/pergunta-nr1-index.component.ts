import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { OpcaoRespostaNr1Service } from 'src/app/demo/service/opcao-resposta-nr1.service';
import {
    PerguntaNr1,
    PerguntaNr1Service,
    TIPO_RESPOSTA,
    TipoResposta
} from 'src/app/demo/service/pergunta-nr1.service';

/** Linha editável da área de opções de resposta (1..n). */
interface OpcaoLinha {
    texto: string;
    ordem: number;
    peso: number;
}

interface TipoRespostaOption {
    label: string;
    value: TipoResposta;
    descricao: string;
}

@Component({
    selector: 'app-pergunta-nr1-index',
    templateUrl: './pergunta-nr1-index.component.html',
    styleUrl: './pergunta-nr1-index.component.scss',
    providers: [MessageService]
})
export class PerguntaNr1IndexComponent implements OnInit {
    perguntas: PerguntaNr1[] = [];
    perguntaDialog = false;
    deletePerguntaDialog = false;
    loading = false;
    submitted = false;

    pergunta: PerguntaNr1 = this.createEmptyPergunta();

    /** Opções de resposta da pergunta em edição (1..n). */
    opcoes: OpcaoLinha[] = [];

    readonly tipoRespostaOptions: TipoRespostaOption[] = [
        { value: 'LIKERT_5', label: 'Escala Likert (5 pontos)', descricao: 'Nunca, Raramente, Às vezes, Frequentemente, Sempre.' },
        { value: 'LIKERT_3', label: 'Escala Likert (3 pontos)', descricao: 'Raro/Nunca, Às vezes, Frequente/Sempre.' },
        { value: 'BOOLEANO', label: 'Booleano (Sim / Não)', descricao: 'Resposta direta de sim ou não.' },
        { value: 'NOMINAL_MULTIPLO', label: 'Múltipla escolha (várias seleções)', descricao: 'Permite selecionar vários fatores.' },
        { value: 'TEXTO_LIVRE', label: 'Texto livre (campo aberto)', descricao: 'Resposta qualitativa; sem opções fixas.' }
    ];

    constructor(
        private readonly messageService: MessageService,
        private readonly perguntaService: PerguntaNr1Service,
        private readonly opcaoService: OpcaoRespostaNr1Service
    ) {}

    ngOnInit(): void {
        void this.loadPerguntas();
    }

    createEmptyPergunta(): PerguntaNr1 {
        return {
            texto: '',
            ordem: 1,
            fator_risco: null,
            obrigatoria: true,
            tipo_resposta: 'LIKERT_5'
        };
    }

    /** Indica se o tipo de resposta selecionado usa opções de resposta cadastráveis. */
    get exigeOpcoes(): boolean {
        return this.pergunta.tipo_resposta !== 'TEXTO_LIVRE';
    }

    /** Ao trocar o tipo para TEXTO_LIVRE, limpa as opções (não se aplicam). */
    onTipoRespostaChange(): void {
        if (!this.exigeOpcoes) {
            this.opcoes = [];
        }
    }

    tipoRespostaLabel(tipo: TipoResposta): string {
        return this.tipoRespostaOptions.find((opcao) => opcao.value === tipo)?.label || tipo;
    }

    async loadPerguntas(): Promise<void> {
        this.loading = true;

        try {
            this.perguntas = await this.perguntaService.getAll();
        } catch (error) {
            console.error('Erro ao carregar perguntas NR-1:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as perguntas.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    async openNew(): Promise<void> {
        this.pergunta = this.createEmptyPergunta();
        this.opcoes = [];

        try {
            this.pergunta.ordem = await this.perguntaService.getProximaOrdem();
        } catch (error) {
            console.error('Erro ao obter próxima ordem:', error);
            // segue com a ordem padrão caso a consulta falhe
        }

        this.submitted = false;
        this.perguntaDialog = true;
    }

    editPergunta(pergunta: PerguntaNr1): void {
        this.pergunta = { ...pergunta };
        // usa as opções já aninhadas (vindas do getAll); ordena por ordem por segurança
        this.opcoes = (pergunta.opcoes_resposta ?? [])
            .slice()
            .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
            .map((opcao) => ({
                texto: opcao.texto,
                ordem: opcao.ordem,
                peso: opcao.peso
            }));
        this.submitted = false;
        this.perguntaDialog = true;
    }

    hideDialog(): void {
        this.perguntaDialog = false;
        this.submitted = false;
    }

    // --- Opções de resposta (1..n) ---

    addOpcao(): void {
        const proximaOrdem = this.opcoes.length > 0
            ? Math.max(...this.opcoes.map((o) => o.ordem || 0)) + 1
            : 1;
        this.opcoes = [...this.opcoes, { texto: '', ordem: proximaOrdem, peso: 0 }];
    }

    removeOpcao(index: number): void {
        this.opcoes = this.opcoes.filter((_, i) => i !== index);
    }

    private opcoesInvalidas(): boolean {
        return this.opcoes.some((opcao) => !opcao.texto?.trim());
    }

    async savePergunta(): Promise<void> {
        this.submitted = true;

        if (!this.pergunta.texto?.trim() || this.pergunta.ordem == null || !this.pergunta.tipo_resposta) {
            return;
        }

        // opções só se aplicam a tipos diferentes de TEXTO_LIVRE
        if (this.exigeOpcoes && this.opcoesInvalidas()) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o texto de todas as opções de resposta.', life: 4000 });
            return;
        }

        const payload = {
            texto: this.pergunta.texto.trim(),
            ordem: this.pergunta.ordem,
            fator_risco: this.pergunta.fator_risco?.trim() || null,
            obrigatoria: this.pergunta.obrigatoria,
            tipo_resposta: this.pergunta.tipo_resposta
        };

        try {
            let perguntaId: string;

            if (this.pergunta.id) {
                const atualizada = await this.perguntaService.update(this.pergunta.id, payload);
                perguntaId = atualizada.id ?? this.pergunta.id;
            } else {
                const criada = await this.perguntaService.create(payload);
                perguntaId = criada.id as string;
            }

            // sincroniza as opções de resposta vinculadas à pergunta
            await this.opcaoService.syncByPergunta(
                perguntaId,
                this.opcoes.map((opcao, index) => ({
                    texto: opcao.texto,
                    ordem: opcao.ordem != null ? opcao.ordem : index + 1,
                    peso: opcao.peso != null ? opcao.peso : 0
                }))
            );

            this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: this.pergunta.id ? 'Pergunta atualizada.' : 'Pergunta criada.',
                life: 3000
            });

            this.perguntaDialog = false;
            this.pergunta = this.createEmptyPergunta();
            this.opcoes = [];
            await this.loadPerguntas();
        } catch (error) {
            console.error('Erro ao salvar pergunta NR-1:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar a pergunta.', life: 3000 });
        }
    }

    confirmDeletePergunta(pergunta: PerguntaNr1): void {
        this.pergunta = { ...pergunta };
        this.deletePerguntaDialog = true;
    }

    async deletePergunta(): Promise<void> {
        if (!this.pergunta.id) {
            return;
        }

        try {
            await this.perguntaService.delete(this.pergunta.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Pergunta removida.', life: 3000 });
            this.deletePerguntaDialog = false;
            this.pergunta = this.createEmptyPergunta();
            await this.loadPerguntas();
        } catch (error) {
            console.error('Erro ao excluir pergunta NR-1:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir a pergunta. Verifique se ela não está vinculada a questionários.', life: 4000 });
        }
    }

    /** Quantidade de opções de resposta de uma pergunta (para a listagem). */
    totalOpcoes(pergunta: PerguntaNr1): number {
        return pergunta.opcoes_resposta?.length ?? 0;
    }
}
