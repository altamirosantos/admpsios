import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import {
    JogoInterativo,
    JogoInterativoService,
    QuestaoInterativa,
    QuestaoInterativaOpcao
} from 'src/app/demo/service/jogo-interativo.service';

type QuestaoOpcaoForm = Required<QuestaoInterativaOpcao>;

type QuestaoForm = Omit<Partial<QuestaoInterativa>, 'options'> & {
    optionsForm: QuestaoOpcaoForm[];
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
            titulo: '',
            mensagem: ''
        };
    }

    createEmptyQuestao(): QuestaoForm {
        return {
            question: '',
            optionsForm: [this.createEmptyOption(true), this.createEmptyOption(false)],
            correct_answer: 0,
            explanation: '',
            insight: ''
        };
    }

    createEmptyOption(isCorrect = false): QuestaoOpcaoForm {
        return {
            id: this.generateOptionId(),
            text: '',
            isCorrect
        };
    }

    generateOptionId(): string {
        return `option-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
                    titulo: this.jogo.titulo.trim(),
                    mensagem: this.jogo.mensagem?.trim() || null
                });
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Jogo interativo atualizado.', life: 3000 });
            } else {
                savedJogo = await this.jogoInterativoService.createJogo({
                    nome: this.jogo.nome.trim(),
                    titulo: this.jogo.titulo.trim(),
                    mensagem: this.jogo.mensagem?.trim() || null
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
        const normalizedCorrectAnswer = this.normalizeCorrectAnswer(questao.correct_answer, questao.options || []);
        this.questao = {
            ...questao,
            correct_answer: normalizedCorrectAnswer,
            optionsForm: this.mapOptionsToForm({
                ...questao,
                correct_answer: normalizedCorrectAnswer
            })
        };
        this.submittedQuestao = false;
        this.questaoDialog = true;
    }

    hideQuestaoDialog(): void {
        this.questaoDialog = false;
        this.submittedQuestao = false;
    }

    mapOptionsToForm(questao: Pick<QuestaoInterativa, 'options' | 'correct_answer'>): QuestaoOpcaoForm[] {
        const normalizedOptions = (questao.options || [])
            .map((option, index) => {
                if (typeof option === 'string') {
                    const parsedOption = this.parseSerializedOption(option);
                    if (parsedOption) {
                        return {
                            id: parsedOption.id || this.generateOptionId(),
                            text: parsedOption.text,
                            isCorrect: questao.correct_answer === index
                        };
                    }

                    return {
                        id: this.generateOptionId(),
                        text: option,
                        isCorrect: questao.correct_answer === index
                    };
                }

                return {
                    id: option.id || this.generateOptionId(),
                    text: option.text || '',
                    isCorrect: questao.correct_answer === index
                };
            })
            .filter((option) => option.text.trim().length > 0);

        if (normalizedOptions.length < 2) {
            return [this.createEmptyOption(true), this.createEmptyOption(false)];
        }

        if (questao.correct_answer < 0 || questao.correct_answer >= normalizedOptions.length) {
            normalizedOptions[0].isCorrect = true;
        }

        return normalizedOptions;
    }

    normalizeCorrectAnswer(correctAnswer: number | undefined, options: Array<string | QuestaoInterativaOpcao>): number {
        const normalizedCorrectAnswer = Number(correctAnswer);
        if (Number.isNaN(normalizedCorrectAnswer) || normalizedCorrectAnswer < 0 || normalizedCorrectAnswer >= options.length) {
            return 0;
        }

        return normalizedCorrectAnswer;
    }

    parseSerializedOption(option: string): QuestaoInterativaOpcao | null {
        const trimmedOption = option.trim();
        if (!trimmedOption.startsWith('{')) {
            return null;
        }

        try {
            const parsedOption = JSON.parse(trimmedOption) as Partial<QuestaoInterativaOpcao>;
            if (typeof parsedOption.text !== 'string' || !parsedOption.text.trim().length) {
                return null;
            }

            return {
                id: parsedOption.id,
                text: parsedOption.text,
                isCorrect: false
            };
        } catch {
            return null;
        }
    }

    getCorrectAnswerLabel(questao: QuestaoInterativa): string {
        const fallbackOption = questao.options?.[questao.correct_answer];
        if (typeof fallbackOption === 'string') {
            return fallbackOption;
        }

        return fallbackOption?.text || 'Alternativa inválida';
    }

    getOptionsPreview(questao: QuestaoInterativa): string {
        return (questao.options || [])
            .map((option) => (typeof option === 'string' ? option : option.text))
            .filter((option) => option?.trim().length)
            .join('\n');
    }

    addOption(): void {
        this.questao.optionsForm = [...(this.questao.optionsForm || []), this.createEmptyOption(false)];
    }

    removeOption(index: number): void {
        const optionsForm = [...(this.questao.optionsForm || [])];
        if (optionsForm.length <= 2) {
            return;
        }

        const [removedOption] = optionsForm.splice(index, 1);
        if (removedOption && this.questao.correct_answer !== undefined && this.questao.correct_answer !== null) {
            if (this.questao.correct_answer === index) {
                this.questao.correct_answer = 0;
            } else if (this.questao.correct_answer > index) {
                this.questao.correct_answer -= 1;
            }
        }

        this.questao.optionsForm = optionsForm.map((option, optionIndex) => ({
            ...option,
            isCorrect: optionIndex === (this.questao.correct_answer ?? 0)
        }));
    }

    setCorrectOption(index: number): void {
        this.questao.correct_answer = index;
        this.questao.optionsForm = (this.questao.optionsForm || []).map((option, optionIndex) => ({
            ...option,
            isCorrect: optionIndex === index
        }));
    }

    getValidOptions(optionsForm: QuestaoOpcaoForm[]): QuestaoOpcaoForm[] {
        return (optionsForm || [])
            .map((option) => ({
                ...option,
                text: option.text.trim(),
                id: option.id || this.generateOptionId()
            }))
            .filter((option) => option.text.length > 0);
    }

    hasValidCorrectOption(optionsForm: QuestaoOpcaoForm[]): boolean {
        const validOptions = this.getValidOptions(optionsForm);
        const correctAnswer = Number(this.questao.correct_answer);
        return !Number.isNaN(correctAnswer) && correctAnswer >= 0 && correctAnswer < validOptions.length;
    }

    async saveQuestao(): Promise<void> {
        this.submittedQuestao = true;

        if (!this.selectedJogo?.id) {
            return;
        }

        const options = this.getValidOptions(this.questao.optionsForm || []);
        const correctAnswer = Number(this.questao.correct_answer);

        if (!this.questao.question?.trim() || options.length < 2 || Number.isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
            return;
        }

        const payload: QuestaoInterativa = {
            jogo_interativo_id: this.selectedJogo.id,
            question: this.questao.question.trim(),
            options: options.map((option) => option.text),
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
