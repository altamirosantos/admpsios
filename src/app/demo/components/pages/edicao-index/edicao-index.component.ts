import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { EdicaoItem, EdicaoPayload, EdicaoService } from 'src/app/demo/service/edicao.service';

@Component({
    selector: 'app-edicao-index',
    templateUrl: './edicao-index.component.html',
    styleUrl: './edicao-index.component.scss',
    providers: [MessageService]
})
export class EdicaoIndexComponent implements OnInit {
    edicoes: EdicaoItem[] = [];
    edicaoDialog = false;
    deleteEdicaoDialog = false;
    loading = false;
    corrigindoTexto = false;
    submitted = false;

    readonly tipoOptions = [
        { label: 'PODCAST', value: 'PODCAST' },
        { label: 'HISTORIA', value: 'HISTORIA' }
    ];

    edicao: EdicaoItem = this.createEmptyEdicao();

    constructor(
        private readonly messageService: MessageService,
        private readonly edicaoService: EdicaoService
    ) {}

    ngOnInit(): void {
        void this.loadEdicoes();
    }

    createEmptyEdicao(): EdicaoItem {
        return {
            titulo: '',
            sinopse: '',
            tipo: '',
            texto_original: '',
            texto_corrigido: '',
            sugestoes: '',
            ajustes: ''
        };
    }

    async loadEdicoes(): Promise<void> {
        this.loading = true;

        try {
            this.edicoes = await this.edicaoService.getAll();
        } catch (error) {
            console.error('Erro ao carregar edições:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os registros de edição.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    openNew(): void {
        this.edicao = this.createEmptyEdicao();
        this.submitted = false;
        this.edicaoDialog = true;
    }

    editEdicao(edicao: EdicaoItem): void {
        this.edicao = {
            ...edicao,
            sinopse: edicao.sinopse || '',
            tipo: edicao.tipo || '',
            texto_original: edicao.texto_original || '',
            texto_corrigido: edicao.texto_corrigido || '',
            sugestoes: edicao.sugestoes || '',
            ajustes: edicao.ajustes || ''
        };
        this.submitted = false;
        this.edicaoDialog = true;
    }

    hideDialog(): void {
        this.edicaoDialog = false;
        this.submitted = false;
    }

    confirmDeleteEdicao(edicao: EdicaoItem): void {
        this.edicao = { ...edicao };
        this.deleteEdicaoDialog = true;
    }

    buildPayload(): EdicaoPayload {
        return {
            titulo: this.edicao.titulo.trim(),
            sinopse: this.normalizeOptionalText(this.edicao.sinopse),
            tipo: this.edicao.tipo.trim(),
            texto_original: this.normalizeOptionalText(this.edicao.texto_original),
            texto_corrigido: this.normalizeOptionalText(this.edicao.texto_corrigido),
            sugestoes: this.normalizeOptionalText(this.edicao.sugestoes),
            ajustes: this.normalizeOptionalText(this.edicao.ajustes)
        };
    }

    normalizeOptionalText(value: string | null | undefined): string | null {
        const normalized = value?.trim() || '';
        return normalized.length ? normalized : null;
    }

    generateSessionId(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }

        return `sessao-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    async corrigirTexto(): Promise<void> {
        if (!this.edicao.tipo?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione o tipo antes de corrigir o texto.', life: 3000 });
            return;
        }

        if (!this.edicao.texto_original?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o texto original antes de solicitar a correção.', life: 3000 });
            return;
        }

        this.corrigindoTexto = true;

        try {
            const output = await this.edicaoService.corrigirTexto(
                this.edicao.tipo.trim(),
                this.edicao.texto_original.trim(),
                this.generateSessionId()
            );

            this.edicao.texto_corrigido = output['texto-corrigido'] || '';
            this.edicao.sugestoes = output['sugestoes-de-melhoria'] || '';
            this.edicao.ajustes = output['ajustes-realizados'] || '';

            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Texto corrigido com sucesso.', life: 3000 });
        } catch (error) {
            console.error('Erro ao corrigir texto da edição:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível corrigir o texto pela Edge Function.', life: 3000 });
        } finally {
            this.corrigindoTexto = false;
        }
    }

    async saveEdicao(): Promise<void> {
        this.submitted = true;

        if (!this.edicao.titulo?.trim() || !this.edicao.tipo?.trim()) {
            return;
        }

        try {
            if (this.edicao.id) {
                await this.edicaoService.update(this.edicao.id, this.buildPayload());
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Registro de edição atualizado.', life: 3000 });
            } else {
                await this.edicaoService.create(this.buildPayload());
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Registro de edição criado.', life: 3000 });
            }

            this.edicaoDialog = false;
            this.edicao = this.createEmptyEdicao();
            await this.loadEdicoes();
        } catch (error) {
            console.error('Erro ao salvar edição:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar o registro de edição.', life: 3000 });
        }
    }

    async deleteEdicao(): Promise<void> {
        if (!this.edicao.id) {
            return;
        }

        try {
            await this.edicaoService.delete(this.edicao.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Registro de edição removido.', life: 3000 });
            this.deleteEdicaoDialog = false;
            this.edicao = this.createEmptyEdicao();
            await this.loadEdicoes();
        } catch (error) {
            console.error('Erro ao excluir edição:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o registro de edição.', life: 3000 });
        }
    }
}