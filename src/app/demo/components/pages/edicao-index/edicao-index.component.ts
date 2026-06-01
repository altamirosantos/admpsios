import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { EdicaoItem, EdicaoPayload, EdicaoService } from 'src/app/demo/service/edicao.service';
import { ResourceItem, ResourcesService } from 'src/app/demo/service/resources.service';

@Component({
    selector: 'app-edicao-index',
    templateUrl: './edicao-index.component.html',
    styleUrl: './edicao-index.component.scss',
    providers: [MessageService]
})
export class EdicaoIndexComponent implements OnInit {
    edicoes: EdicaoItem[] = [];
    resources: ResourceItem[] = [];
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
        private readonly edicaoService: EdicaoService,
        private readonly resourcesService: ResourcesService
    ) {}

    ngOnInit(): void {
        void this.loadInitialData();
    }

    createEmptyEdicao(): EdicaoItem {
        return {
            titulo: '',
            sinopse: '',
            roteiro: '',
            tipo: '',
            texto_original: '',
            texto_corrigido: '',
            sugestoes: '',
            ajustes: '',
            resource_id: null,
            resource: null
        };
    }

    async loadInitialData(): Promise<void> {
        this.loading = true;

        try {
            const [edicoes, resources] = await Promise.all([
                this.edicaoService.getAll(),
                this.resourcesService.getAll()
            ]);

            this.edicoes = edicoes;
            this.resources = resources;
        } catch (error) {
            console.error('Erro ao carregar dados de edição:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os registros de edição.', life: 3000 });
        } finally {
            this.loading = false;
        }
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
            roteiro: edicao.roteiro || '',
            tipo: edicao.tipo || '',
            texto_original: edicao.texto_original || '',
            texto_corrigido: edicao.texto_corrigido || '',
            sugestoes: edicao.sugestoes || '',
            ajustes: edicao.ajustes || '',
            resource_id: edicao.resource_id || null,
            resource: edicao.resource || null
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
            roteiro: this.normalizeOptionalText(this.edicao.roteiro),
            tipo: this.edicao.tipo.trim(),
            texto_original: this.normalizeOptionalText(this.edicao.texto_original),
            texto_corrigido: this.normalizeOptionalText(this.edicao.texto_corrigido),
            sugestoes: this.normalizeOptionalText(this.edicao.sugestoes),
            ajustes: this.normalizeOptionalText(this.edicao.ajustes),
            resource_id: this.edicao.resource_id || null
        };
    }

    normalizeOptionalText(value: string | null | undefined): string | null {
        const normalized = value?.trim() || '';
        return normalized.length ? normalized : null;
    }

    hasAssociatedResource(edicao: EdicaoItem): boolean {
        return !!edicao.resource_id;
    }

    canExecuteMedia(edicao: EdicaoItem): boolean {
        return !!edicao.resource?.url?.trim();
    }

    getMediaActionIcon(edicao: EdicaoItem): string {
        switch (edicao.resource?.type) {
            case 'audio':
            case 'video':
                return 'pi pi-play';
            case 'document':
                return 'pi pi-file';
            default:
                return 'pi pi-external-link';
        }
    }

    getMediaActionLabel(edicao: EdicaoItem): string {
        switch (edicao.resource?.type) {
            case 'audio':
                return 'Ouvir';
            case 'video':
                return 'Assistir';
            case 'document':
                return 'Abrir PDF';
            default:
                return 'Abrir mídia';
        }
    }

    async executarMidia(edicao: EdicaoItem): Promise<void> {
        const fileName = edicao.resource?.url?.trim();

        if (!fileName) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'A edição não possui um arquivo de mídia associado.', life: 3000 });
            return;
        }

        try {
            const mediaUrl = await this.resourcesService.getMediaFileUrl(fileName);
            window.open(mediaUrl, '_blank', 'noopener');
        } catch (error) {
            console.error('Erro ao abrir mídia da edição:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível abrir a mídia associada.', life: 3000 });
        }
    }

    generateSessionId(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }

        return `sessao-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    async corrigirTexto(acao: 'EDICAO' | 'ROTEIRO' = 'EDICAO'): Promise<void> {
        const textoBase = acao === 'ROTEIRO'
            ? this.edicao.texto_corrigido?.trim()
            : this.edicao.texto_original?.trim();

        if (!this.edicao.tipo?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione o tipo antes de processar o texto.', life: 3000 });
            return;
        }

        if (!textoBase) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: acao === 'ROTEIRO'
                    ? 'Informe o texto corrigido antes de gerar o roteiro.'
                    : 'Informe o texto original antes de solicitar a correção.',
                life: 3000
            });
            return;
        }

        this.corrigindoTexto = true;

        try {
            const output = await this.edicaoService.corrigirTexto(
                this.edicao.tipo.trim(),
                textoBase,
                acao,
                this.generateSessionId()
            );

            if (acao === 'ROTEIRO') {
                this.edicao.roteiro = typeof output === 'string' ? output : output['texto-corrigido'] || '';
            } else {
                this.edicao.texto_corrigido = typeof output === 'string' ? output : output['texto-corrigido'] || '';
            }

            if (typeof output !== 'string') {
                this.edicao.sugestoes = output['sugestoes-de-melhoria'] || '';
                this.edicao.ajustes = output['ajustes-realizados'] || '';
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: acao === 'ROTEIRO' ? 'Roteiro gerado com sucesso.' : 'Texto corrigido com sucesso.',
                life: 3000
            });
        } catch (error) {
            console.error('Erro ao corrigir texto da edição:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: acao === 'ROTEIRO'
                    ? 'Não foi possível gerar o roteiro pela Edge Function.'
                    : 'Não foi possível corrigir o texto pela Edge Function.',
                life: 3000
            });
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
