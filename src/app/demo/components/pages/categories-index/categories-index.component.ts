import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CategoriesService, MediaCategory } from 'src/app/demo/service/categories.service';

@Component({
    selector: 'app-categories-index',
    templateUrl: './categories-index.component.html',
    styleUrl: './categories-index.component.scss',
    providers: [MessageService]
})
export class CategoriesIndexComponent implements OnInit {
    categories: MediaCategory[] = [];
    categoryDialog = false;
    deleteCategoryDialog = false;
    loading = false;
    submitted = false;

    category: MediaCategory = this.createEmptyCategory();

    constructor(
        private readonly messageService: MessageService,
        private readonly categoriesService: CategoriesService
    ) {}

    ngOnInit(): void {
        void this.loadCategories();
    }

    createEmptyCategory(): MediaCategory {
        return {
            name: '',
            description: ''
        };
    }

    async loadCategories(): Promise<void> {
        this.loading = true;

        try {
            this.categories = await this.categoriesService.getAll();
        } catch (error) {
            console.error('Erro ao carregar categorias de mídia:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as categorias.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    openNew(): void {
        this.category = this.createEmptyCategory();
        this.submitted = false;
        this.categoryDialog = true;
    }

    editCategory(category: MediaCategory): void {
        this.category = { ...category };
        this.submitted = false;
        this.categoryDialog = true;
    }

    hideDialog(): void {
        this.categoryDialog = false;
        this.submitted = false;
    }

    async saveCategory(): Promise<void> {
        this.submitted = true;

        if (!this.category.name?.trim()) {
            return;
        }

        const payload = {
            name: this.category.name.trim(),
            description: this.category.description?.trim() || null
        };

        try {
            if (this.category.id) {
                await this.categoriesService.update(this.category.id, payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Categoria atualizada.', life: 3000 });
            } else {
                await this.categoriesService.create(payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Categoria criada.', life: 3000 });
            }

            this.categoryDialog = false;
            this.category = this.createEmptyCategory();
            await this.loadCategories();
        } catch (error) {
            console.error('Erro ao salvar categoria de mídia:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar a categoria.', life: 3000 });
        }
    }

    confirmDeleteCategory(category: MediaCategory): void {
        this.category = { ...category };
        this.deleteCategoryDialog = true;
    }

    async deleteCategory(): Promise<void> {
        if (!this.category.id) {
            return;
        }

        try {
            await this.categoriesService.delete(this.category.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Categoria removida.', life: 3000 });
            this.deleteCategoryDialog = false;
            this.category = this.createEmptyCategory();
            await this.loadCategories();
        } catch (error) {
            console.error('Erro ao excluir categoria de mídia:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir a categoria.', life: 3000 });
        }
    }
}