import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import {
    JogoInterativo,
    JogoInterativoService,
    QuestaoInterativa
} from 'src/app/demo/service/jogo-interativo.service';

type QuestaoForm = Partial<QuestaoInterativa> & {
    optionsText: string;
};

@Component({
    selector: 'app-jogo-interativo-index',
    templateUrl: './jogo-interativo-index.component.html',
    styleUrl: './jogo-interativo-index.component.scss',
    providers: [MessageService]
})
export class JogoInterativoIndexComponent implements OnInit {
    jogos: JogoInterativo[] = [];
    questoes: QuestaoInterativa[] = [];

    jogoDialog = false;
    questaoDialog = false;
    deleteJogoDialog = false;
    deleteQuestaoDialog = false;

    jogo: JogoInterativo = this.createEmptyJogo();
    questao: QuestaoForm = this.createEmptyQuestao();

    selectedJogo: JogoInterativo | null = null;
    selectedQuestao: QuestaoInterativa | null = null;

    loadingJogos = false;
    loadingQuestoes = false;
    submittedJogo = false;
    submittedQuestao = false;

    constructor(
        private readonly messageService: MessageService,
        private readonly jogoInterativoService: JogoInterativoService
    ) {}

    ngOnInit(): void {
        void this.loadJogos();
    }

    onJogoRowKeydown(event: KeyboardEvent, jogo: JogoInterativo): void {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            void this.selectJogo(jogo);
        }
    }

    createEmptyJogo(): JogoInterativo {
        return {
            nome: '',
            titulo: ''
        };
    }

    createEmptyQuestao(): QuestaoForm {
        return {
            question: '',
            optionsText: '',
            correct_answer: 0,
            explanation: '',
            insight: ''
        };
    }

    async loadJogos(selectedId?: number): Promise<void> {
        this.loadingJogos = true;
        try {
            this.jogos = await this.jogoInterativoService.getJogos();

            if (selectedId) {
                const jogoSelecionado = this.jogos.find((item) => item.id === selectedId) || null;
                if (jogoSelecionado) {
                    await this.selectJogo(jogoSelecionado);
                    return;
                }
            }

            if (this.selectedJogo?.id) {
                const jogoAtualizado = this.jogos.find((item) => item.id === this.selectedJogo?.id) || null;
                if (jogoAtualizado) {
                    this.selectedJogo = jogoAtualizado;
                    return;
                }
            }

            if (!this.jogos.length) {
                this.selectedJogo = null;
                this.questoes = [];
            }
        } catch (error) {
            console.error('Erro ao carregar jogos interativos:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os jogos interativos.', life: 3000 });
        } finally {
            this.loadingJogos = false;
        }
    }

    async selectJogo(jogo: JogoInterativo): Promise<void> {
        this.selectedJogo = jogo;
        if (!jogo.id) {
            this.questoes = [];
            return;
        }

        this.loadingQuestoes = true;
        try {
            this.questoes = await this.jogoInterativoService.getQuestoesByJogoId(jogo.id);
        } catch (error) {
            console.error('Erro ao carregar questões interativas:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as perguntas do jogo.', life: 3000 });
            this.questoes = [];
        } finally {
            this.loadingQuestoes = false;
        }
    }

    openNewJogo(): void {
        this.jogo = this.createEmptyJogo();
        this.submittedJogo = false;
        this.jogoDialog = true;
    }

    editJogo(jogo: JogoInterativo): void {
        this.jogo = { ...jogo };
        this.submittedJogo = false;
        this.jogoDialog = true;
    }

    hideJogoDialog(): void {
        this.jogoDialog = false;
        this.submittedJogo = false;
    }

    async saveJogo(): Promise<void> {
        this.submittedJogo = true;

        if (!this.jogo.nome?.trim() || !this.jogo.titulo?.trim()) {
            return;
        }

        try {
            let savedJogo: JogoInterativo;
            if (this.jogo.id) {
                savedJogo = await this.jogoInterativoService.updateJogo(this.jogo.id, {
                    nome: this.jogo.nome.trim(),
                    titulo: this.jogo.titulo.trim()
                });
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Jogo interativo atualizado.', life: 3000 });
            } else {
                savedJogo = await this.jogoInterativoService.createJogo({
                    nome: this.jogo.nome.trim(),
                    titulo: this.jogo.titulo.trim()
                });
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Jogo interativo criado.', life: 3000 });
            }

            this.jogoDialog = false;
            this.jogo = this.createEmptyJogo();
            await this.loadJogos(savedJogo.id);
        } catch (error) {
            console.error('Erro ao salvar jogo interativo:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar o jogo interativo.', life: 3000 });
        }
    }

    confirmDeleteJogo(jogo: JogoInterativo): void {
        this.jogo = { ...jogo };
        this.deleteJogoDialog = true;
    }

    async deleteJogo(): Promise<void> {
        if (!this.jogo.id) {
            return;
        }

        try {
            await this.jogoInterativoService.deleteJogo(this.jogo.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Jogo interativo removido.', life: 3000 });

            if (this.selectedJogo?.id === this.jogo.id) {
                this.selectedJogo = null;
                this.questoes = [];
            }

            this.deleteJogoDialog = false;
            this.jogo = this.createEmptyJogo();
            await this.loadJogos();
        } catch (error) {
            console.error('Erro ao excluir jogo interativo:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o jogo interativo.', life: 3000 });
        }
    }

    openNewQuestao(): void {
        if (!this.selectedJogo?.id) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um jogo interativo antes de cadastrar perguntas.', life: 3000 });
            return;
        }

        this.questao = {
            ...this.createEmptyQuestao(),
            jogo_interativo_id: this.selectedJogo.id
        };
        this.submittedQuestao = false;
        this.questaoDialog = true;
    }

    editQuestao(questao: QuestaoInterativa): void {
        this.questao = {
            ...questao,
            optionsText: (questao.options || []).join('\n')
        };
        this.submittedQuestao = false;
        this.questaoDialog = true;
    }

    hideQuestaoDialog(): void {
        this.questaoDialog = false;
        this.submittedQuestao = false;
    }

    parseOptions(optionsText: string): string[] {
        return optionsText
            .split('\n')
            .map((item) => item.trim())
            .filter((item) => !!item);
    }

    getCorrectAnswerLabel(questao: QuestaoInterativa): string {
        return questao.options?.[questao.correct_answer] || 'Índice inválido';
    }

    async saveQuestao(): Promise<void> {
        this.submittedQuestao = true;

        if (!this.selectedJogo?.id) {
            return;
        }

        const options = this.parseOptions(this.questao.optionsText || '');
        const correctAnswer = Number(this.questao.correct_answer);

        if (!this.questao.question?.trim() || options.length < 2 || Number.isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
            return;
        }

        const payload: QuestaoInterativa = {
            jogo_interativo_id: this.selectedJogo.id,
            question: this.questao.question.trim(),
            options,
            correct_answer: correctAnswer,
            explanation: this.questao.explanation?.trim() || null,
            insight: this.questao.insight?.trim() || null
        };

        try {
            if (this.questao.id) {
                await this.jogoInterativoService.updateQuestao(this.questao.id, payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Pergunta atualizada.', life: 3000 });
            } else {
                await this.jogoInterativoService.createQuestao(payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Pergunta criada.', life: 3000 });
            }

            this.questaoDialog = false;
            this.questao = this.createEmptyQuestao();
            await this.selectJogo(this.selectedJogo);
        } catch (error) {
            console.error('Erro ao salvar pergunta interativa:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar a pergunta.', life: 3000 });
        }
    }

    confirmDeleteQuestao(questao: QuestaoInterativa): void {
        this.selectedQuestao = questao;
        this.deleteQuestaoDialog = true;
    }

    async deleteQuestao(): Promise<void> {
        if (!this.selectedQuestao?.id || !this.selectedJogo) {
            return;
        }

        try {
            await this.jogoInterativoService.deleteQuestao(this.selectedQuestao.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Pergunta removida.', life: 3000 });
            this.deleteQuestaoDialog = false;
            this.selectedQuestao = null;
            await this.selectJogo(this.selectedJogo);
        } catch (error) {
            console.error('Erro ao excluir pergunta interativa:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir a pergunta.', life: 3000 });
        }
    }
}
