import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Cargo, CargoService } from 'src/app/demo/service/cargo.service';
import { Empresa, EmpresaService } from 'src/app/demo/service/empresa.service';

interface SelectOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-cargo-index',
    templateUrl: './cargo-index.component.html',
    styleUrl: './cargo-index.component.scss',
    providers: [MessageService]
})
export class CargoIndexComponent implements OnInit {
    cargos: Cargo[] = [];
    empresaOptions: SelectOption[] = [];

    /** Filtro da listagem por empresa. */
    filtroEmpresaId: string | null = null;

    cargoDialog = false;
    deleteCargoDialog = false;
    loading = false;
    submitted = false;

    cargo: Cargo = this.createEmptyCargo();

    constructor(
        private readonly messageService: MessageService,
        private readonly cargoService: CargoService,
        private readonly empresaService: EmpresaService
    ) {}

    ngOnInit(): void {
        void this.loadCargos();
        void this.loadEmpresaOptions();
    }

    createEmptyCargo(): Cargo {
        return {
            empresa_id: '',
            nome: ''
        };
    }

    async loadCargos(): Promise<void> {
        this.loading = true;

        try {
            this.cargos = await this.cargoService.getAll();
        } catch (error) {
            console.error('Erro ao carregar cargos:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os cargos.', life: 3000 });
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

    /** Cargos visíveis após aplicar o filtro por empresa. */
    get cargosFiltrados(): Cargo[] {
        if (!this.filtroEmpresaId) {
            return this.cargos;
        }
        return this.cargos.filter((cargo) => cargo.empresa_id === this.filtroEmpresaId);
    }

    limparFiltros(): void {
        this.filtroEmpresaId = null;
    }

    openNew(): void {
        if (this.empresaOptions.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Cadastre uma empresa antes de criar cargos.', life: 4000 });
            return;
        }

        this.cargo = this.createEmptyCargo();
        // pré-seleciona a empresa do filtro, se houver
        if (this.filtroEmpresaId) {
            this.cargo.empresa_id = this.filtroEmpresaId;
        }
        this.submitted = false;
        this.cargoDialog = true;
    }

    editCargo(cargo: Cargo): void {
        this.cargo = { ...cargo };
        this.submitted = false;
        this.cargoDialog = true;
    }

    hideDialog(): void {
        this.cargoDialog = false;
        this.submitted = false;
    }

    async saveCargo(): Promise<void> {
        this.submitted = true;

        if (!this.cargo.empresa_id || !this.cargo.nome?.trim()) {
            return;
        }

        const payload = {
            empresa_id: this.cargo.empresa_id,
            nome: this.cargo.nome.trim()
        };

        try {
            if (this.cargo.id) {
                await this.cargoService.update(this.cargo.id, payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Cargo atualizado.', life: 3000 });
            } else {
                await this.cargoService.create(payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Cargo criado.', life: 3000 });
            }

            this.cargoDialog = false;
            this.cargo = this.createEmptyCargo();
            await this.loadCargos();
        } catch (error) {
            console.error('Erro ao salvar cargo:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar o cargo.', life: 3000 });
        }
    }

    confirmDeleteCargo(cargo: Cargo): void {
        this.cargo = { ...cargo };
        this.deleteCargoDialog = true;
    }

    async deleteCargo(): Promise<void> {
        if (!this.cargo.id) {
            return;
        }

        try {
            await this.cargoService.delete(this.cargo.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Cargo removido.', life: 3000 });
            this.deleteCargoDialog = false;
            this.cargo = this.createEmptyCargo();
            await this.loadCargos();
        } catch (error) {
            console.error('Erro ao excluir cargo:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o cargo. Verifique se não há aplicações vinculadas.', life: 4000 });
        }
    }

    empresaLabel(cargo: Cargo): string {
        return cargo.empresa?.nome || '—';
    }
}
