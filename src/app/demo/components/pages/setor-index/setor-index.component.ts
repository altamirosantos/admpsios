import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Empresa, EmpresaService } from 'src/app/demo/service/empresa.service';
import { Setor, SetorService } from 'src/app/demo/service/setor.service';

interface SelectOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-setor-index',
    templateUrl: './setor-index.component.html',
    styleUrl: './setor-index.component.scss',
    providers: [MessageService]
})
export class SetorIndexComponent implements OnInit {
    setores: Setor[] = [];
    empresaOptions: SelectOption[] = [];

    /** Filtro da listagem por empresa. */
    filtroEmpresaId: string | null = null;

    setorDialog = false;
    deleteSetorDialog = false;
    loading = false;
    submitted = false;

    setor: Setor = this.createEmptySetor();

    constructor(
        private readonly messageService: MessageService,
        private readonly setorService: SetorService,
        private readonly empresaService: EmpresaService
    ) {}

    ngOnInit(): void {
        void this.loadSetores();
        void this.loadEmpresaOptions();
    }

    createEmptySetor(): Setor {
        return {
            empresa_id: '',
            nome: ''
        };
    }

    async loadSetores(): Promise<void> {
        this.loading = true;

        try {
            this.setores = await this.setorService.getAll();
        } catch (error) {
            console.error('Erro ao carregar setores:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os setores.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    async loadEmpresaOptions(): Promise<void> {
        try {
            const empresas = await this.empresaService.getAll();
            this.empresaOptions = empresas
                .filter((empresa): empresa is Empresa & { id: string } => !!empresa.id)
                .map((empresa) => ({ label: empresa.nome, value: empresa.id }));
        } catch (error) {
            console.error('Erro ao carregar empresas para seleção:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as empresas.', life: 3000 });
        }
    }

    /** Setores visíveis após aplicar o filtro por empresa. */
    get setoresFiltrados(): Setor[] {
        if (!this.filtroEmpresaId) {
            return this.setores;
        }
        return this.setores.filter((setor) => setor.empresa_id === this.filtroEmpresaId);
    }

    limparFiltros(): void {
        this.filtroEmpresaId = null;
    }

    openNew(): void {
        if (this.empresaOptions.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Cadastre uma empresa antes de criar setores.', life: 4000 });
            return;
        }

        this.setor = this.createEmptySetor();
        // pré-seleciona a empresa do filtro, se houver
        if (this.filtroEmpresaId) {
            this.setor.empresa_id = this.filtroEmpresaId;
        }
        this.submitted = false;
        this.setorDialog = true;
    }

    editSetor(setor: Setor): void {
        this.setor = { ...setor };
        this.submitted = false;
        this.setorDialog = true;
    }

    hideDialog(): void {
        this.setorDialog = false;
        this.submitted = false;
    }

    async saveSetor(): Promise<void> {
        this.submitted = true;

        if (!this.setor.empresa_id || !this.setor.nome?.trim()) {
            return;
        }

        const payload = {
            empresa_id: this.setor.empresa_id,
            nome: this.setor.nome.trim()
        };

        try {
            if (this.setor.id) {
                await this.setorService.update(this.setor.id, payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Setor atualizado.', life: 3000 });
            } else {
                await this.setorService.create(payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Setor criado.', life: 3000 });
            }

            this.setorDialog = false;
            this.setor = this.createEmptySetor();
            await this.loadSetores();
        } catch (error) {
            console.error('Erro ao salvar setor:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar o setor.', life: 3000 });
        }
    }

    confirmDeleteSetor(setor: Setor): void {
        this.setor = { ...setor };
        this.deleteSetorDialog = true;
    }

    async deleteSetor(): Promise<void> {
        if (!this.setor.id) {
            return;
        }

        try {
            await this.setorService.delete(this.setor.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Setor removido.', life: 3000 });
            this.deleteSetorDialog = false;
            this.setor = this.createEmptySetor();
            await this.loadSetores();
        } catch (error) {
            console.error('Erro ao excluir setor:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o setor. Verifique se não há aplicações vinculadas.', life: 4000 });
        }
    }

    empresaLabel(setor: Setor): string {
        return setor.empresa?.nome || '—';
    }
}
