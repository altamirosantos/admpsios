import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CategoriesService, MediaCategory } from 'src/app/demo/service/categories.service';
import { ResourceItem, ResourcePayload, ResourcesService, ResourceType } from 'src/app/demo/service/resources.service';

type ResourceForm = {
    id?: string;
    title: string;
    description: string;
    type: ResourceType;
    url: string;
    duration: number | null;
    tagsText: string;
    interactiveDataText: string;
    categoryIds: string[];
};

@Component({
    selector: 'app-termometro-index',
    standalone: false,
    templateUrl: './resources-index.component.html',
    styleUrl: './resources-index.component.scss',
    providers: [MessageService]
})
export class ResourcesIndexComponent implements OnInit {
    resources: ResourceItem[] = [];
    categories: MediaCategory[] = [];
    resourceDialog = false;
    deleteResourceDialog = false;
    loading = false;
    submitted = false;
    selectedFile: File | null = null;
    originalFileName = '';

    readonly typeOptions: { label: string; value: ResourceType }[] = [
        { label: 'Exercício', value: 'exercise' },
        { label: 'Áudio', value: 'audio' },
        { label: 'Vídeo', value: 'video' },
        { label: 'Documento', value: 'document' }
    ];

    resourceForm: ResourceForm = this.createEmptyResource();

    constructor(
        private readonly messageService: MessageService,
        private readonly resourcesService: ResourcesService,
        private readonly categoriesService: CategoriesService
    ) {}

    ngOnInit(): void {
        void this.loadInitialData();
    }

    createEmptyResource(): ResourceForm {
        return {
            title: '',
            description: '',
            type: 'exercise',
            url: '',
            duration: null,
            tagsText: '',
            interactiveDataText: '',
            categoryIds: []
        };
    }

    async loadInitialData(): Promise<void> {
        this.loading = true;

        try {
            const [resources, categories] = await Promise.all([
                this.resourcesService.getAll(),
                this.categoriesService.getAll()
            ]);

            this.resources = resources;
            this.categories = categories;
        } catch (error) {
            console.error('Erro ao carregar recursos:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os recursos.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    openNew(): void {
        this.resourceForm = this.createEmptyResource();
        this.selectedFile = null;
        this.originalFileName = '';
        this.submitted = false;
        this.resourceDialog = true;
    }

    editResource(resource: ResourceItem): void {
        this.resourceForm = {
            id: resource.id,
            title: resource.title,
            description: resource.description || '',
            type: resource.type,
            url: resource.url || '',
            duration: resource.duration,
            tagsText: (resource.tags || []).join(', '),
            interactiveDataText: resource.interactive_data ? JSON.stringify(resource.interactive_data, null, 2) : '',
            categoryIds: resource.category_ids || []
        };
        this.selectedFile = null;
        this.originalFileName = resource.url || '';
        this.submitted = false;
        this.resourceDialog = true;
    }

    hideDialog(): void {
        this.resourceDialog = false;
        this.selectedFile = null;
        this.originalFileName = '';
        this.submitted = false;
    }

    confirmDeleteResource(resource: ResourceItem): void {
        this.resourceForm = {
            id: resource.id,
            title: resource.title,
            description: resource.description || '',
            type: resource.type,
            url: resource.url || '',
            duration: resource.duration,
            tagsText: (resource.tags || []).join(', '),
            interactiveDataText: resource.interactive_data ? JSON.stringify(resource.interactive_data, null, 2) : '',
            categoryIds: resource.category_ids || []
        };
        this.selectedFile = null;
        this.originalFileName = resource.url || '';
        this.deleteResourceDialog = true;
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] || null;
        this.selectedFile = file;

        if (file) {
            this.resourceForm.url = file.name;
        }
    }

    clearSelectedFile(fileInput?: HTMLInputElement): void {
        this.selectedFile = null;
        this.resourceForm.url = this.originalFileName;

        if (fileInput) {
            fileInput.value = '';
        }
    }

    get selectedFileLabel(): string {
        return this.selectedFile?.name || 'Nenhum arquivo selecionado';
    }

    parseTags(tagsText: string): string[] {
        return tagsText
            .split(/\r?\n|,/) 
            .map((item) => item.trim())
            .filter((item) => !!item);
    }

    parseInteractiveData(interactiveDataText: string): Record<string, unknown> | null {
        const normalizedText = interactiveDataText.trim();

        if (!normalizedText) {
            return null;
        }

        return JSON.parse(normalizedText) as Record<string, unknown>;
    }

    hasValidInteractiveData(): boolean {
        try {
            this.parseInteractiveData(this.resourceForm.interactiveDataText);
            return true;
        } catch (error) {
            console.debug('interactive_data inválido:', error);
            return false;
        }
    }

    getCategoryNames(resource: ResourceItem): string {
        return resource.category_names?.length ? resource.category_names.join(', ') : '—';
    }

    async saveResource(): Promise<void> {
        this.submitted = true;

        if (!this.resourceForm.title.trim() || !this.resourceForm.type || !this.hasValidInteractiveData()) {
            return;
        }

        let payload: ResourcePayload;

        try {
            let nextFileName = this.resourceForm.url.trim() || null;

            if (this.selectedFile) {
                nextFileName = await this.resourcesService.uploadMediaFile(this.selectedFile, nextFileName);
            }

            payload = {
                title: this.resourceForm.title.trim(),
                description: this.resourceForm.description.trim() || null,
                type: this.resourceForm.type,
                url: nextFileName,
                duration: this.resourceForm.duration ?? null,
                tags: this.parseTags(this.resourceForm.tagsText),
                interactive_data: this.parseInteractiveData(this.resourceForm.interactiveDataText)
            };
        } catch (error) {
            console.error('interactive_data inválido ao salvar resource:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'O campo de dados interativos precisa conter um JSON válido.', life: 3000 });
            return;
        }

        try {
            if (this.resourceForm.id) {
                await this.resourcesService.update(this.resourceForm.id, payload, this.resourceForm.categoryIds);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Resource atualizado.', life: 3000 });
            } else {
                await this.resourcesService.create(payload, this.resourceForm.categoryIds);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Resource criado.', life: 3000 });
            }

            this.resourceDialog = false;
            this.resourceForm = this.createEmptyResource();
            this.selectedFile = null;
            this.originalFileName = '';
            await this.loadInitialData();
        } catch (error) {
            console.error('Erro ao salvar resource:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar o resource.', life: 3000 });
        }
    }

    async deleteResource(): Promise<void> {
        if (!this.resourceForm.id) {
            return;
        }

        try {
            if (this.resourceForm.url.trim()) {
                await this.resourcesService.deleteMediaFile(this.resourceForm.url.trim());
            }

            await this.resourcesService.delete(this.resourceForm.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Resource removido.', life: 3000 });
            this.deleteResourceDialog = false;
            this.resourceForm = this.createEmptyResource();
            this.selectedFile = null;
            this.originalFileName = '';
            await this.loadInitialData();
        } catch (error) {
            console.error('Erro ao excluir resource:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o resource.', life: 3000 });
        }
    }
}
