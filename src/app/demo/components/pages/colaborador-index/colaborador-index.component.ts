import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Colaborador, ColaboradorService } from 'src/app/demo/service/colaborador.service';
import { Empresa, EmpresaService } from 'src/app/demo/service/empresa.service';
import { Filial, FilialService } from 'src/app/demo/service/filial.service';

interface SelectOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-colaborador-index',
    templateUrl: './colaborador-index.component.html',
    styleUrl: './colaborador-index.component.scss',
    providers: [MessageService]
})
export class ColaboradorIndexComponent implements OnInit {
    colaboradores: Colaborador[] = [];

    /** Empresas e filiais completas (para montar as opções e os filtros dependentes). */
    private empresas: Empresa[] = [];
    private filiais: Filial[] = [];

    empresaOptions: SelectOption[] = [];
    /** Filiais do formulário — todas as filiais da empresa escolhida no diálogo. */
    filialFormOptions: SelectOption[] = [];

    // --- Filtros da listagem ---
    filtroEmpresaId: string | null = null;
    filtroFilialId: string | null = null;
    /** Filiais disponíveis no filtro (dependem da empresa selecionada no filtro). */
    filtroFilialOptions: SelectOption[] = [];

    colaboradorDialog = false;
    deleteColaboradorDialog = false;
    loading = false;
    submitted = false;

    colaborador: Colaborador = this.createEmptyColaborador();
    /** Empresa escolhida no diálogo (deriva as filiais selecionáveis). */
    formEmpresaId: string | null = null;

    constructor(
        private readonly messageService: MessageService,
        private readonly colaboradorService: ColaboradorService,
        private readonly empresaService: EmpresaService,
        private readonly filialService: FilialService
    ) {}

    ngOnInit(): void {
        void this.loadColaboradores();
        void this.loadOptions();
    }

    createEmptyColaborador(): Colaborador {
        return {
            filial_id: '',
            nome: '',
            email: null
        };
    }

    async loadColaboradores(): Promise<void> {
        this.loading = true;

        try {
            this.colaboradores = await this.colaboradorService.getAll();
        } catch (error) {
            console.error('Erro ao carregar colaboradores:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os colaboradores.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    async loadOptions(): Promise<void> {
        try {
            const [empresas, filiais] = await Promise.all([
                this.empresaService.getAll(),
                this.filialService.getAll()
            ]);

            this.empresas = empresas;
            this.filiais = filiais;

            this.empresaOptions = empresas
                .filter((empresa): empresa is Empresa & { id: string } => !!empresa.id)
                .map((empresa) => ({ label: empresa.nome, value: empresa.id }));
        } catch (error) {
            console.error('Erro ao carregar empresas/filiais para seleção:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar empresas e filiais.', life: 3000 });
        }
    }

    // --- Filtros da listagem (empresa -> filial) ---

    /** Ao trocar a empresa do filtro, recarrega as filiais e limpa a filial selecionada. */
    onFiltroEmpresaChange(): void {
        this.filtroFilialId = null;
        this.filtroFilialOptions = this.filiaisDaEmpresa(this.filtroEmpresaId);
    }

    /** Colaboradores visíveis após aplicar os filtros de empresa e filial. */
    get colaboradoresFiltrados(): Colaborador[] {
        return this.colaboradores.filter((colaborador) => {
            if (this.filtroFilialId) {
                return colaborador.filial_id === this.filtroFilialId;
            }
            if (this.filtroEmpresaId) {
                return colaborador.filial?.empresa?.id === this.filtroEmpresaId;
            }
            return true;
        });
    }

    limparFiltros(): void {
        this.filtroEmpresaId = null;
        this.filtroFilialId = null;
        this.filtroFilialOptions = [];
    }

    /** Monta as opções de filial de uma empresa (usado no filtro e no formulário). */
    private filiaisDaEmpresa(empresaId: string | null): SelectOption[] {
        if (!empresaId) {
            return [];
        }
        return this.filiais
            .filter((filial): filial is Filial & { id: string } => !!filial.id && filial.empresa_id === empresaId)
            .map((filial) => ({
                label: filial.nome_fantasia || filial.razao_social || filial.cnpj || 'Filial sem nome',
                value: filial.id
            }));
    }

    // --- Formulário (empresa -> filial) ---

    /** Ao trocar a empresa no diálogo, recarrega as filiais e limpa a filial escolhida. */
    onFormEmpresaChange(): void {
        this.colaborador.filial_id = '';
        this.filialFormOptions = this.filiaisDaEmpresa(this.formEmpresaId);
    }

    openNew(): void {
        if (this.empresaOptions.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Cadastre uma empresa e uma filial antes de criar colaboradores.', life: 4000 });
            return;
        }

        this.colaborador = this.createEmptyColaborador();
        this.formEmpresaId = null;
        this.filialFormOptions = [];
        this.submitted = false;
        this.colaboradorDialog = true;
    }

    editColaborador(colaborador: Colaborador): void {
        this.colaborador = { ...colaborador };
        // deriva a empresa a partir da filial do colaborador para preencher o cascata
        this.formEmpresaId = colaborador.filial?.empresa?.id ?? this.empresaIdDaFilial(colaborador.filial_id);
        this.filialFormOptions = this.filiaisDaEmpresa(this.formEmpresaId);
        this.submitted = false;
        this.colaboradorDialog = true;
    }

    private empresaIdDaFilial(filialId: string): string | null {
        const filial = this.filiais.find((f) => f.id === filialId);
        return filial?.empresa_id ?? null;
    }

    hideDialog(): void {
        this.colaboradorDialog = false;
        this.submitted = false;
    }

    async saveColaborador(): Promise<void> {
        this.submitted = true;

        if (!this.colaborador.nome?.trim() || !this.colaborador.filial_id) {
            return;
        }

        if (this.colaborador.email && !this.isValidEmail(this.colaborador.email)) {
            return;
        }

        const payload = {
            filial_id: this.colaborador.filial_id,
            nome: this.colaborador.nome.trim(),
            email: this.colaborador.email?.trim() || null
        };

        try {
            if (this.colaborador.id) {
                await this.colaboradorService.update(this.colaborador.id, payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Colaborador atualizado.', life: 3000 });
            } else {
                await this.colaboradorService.create(payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Colaborador criado.', life: 3000 });
            }

            this.colaboradorDialog = false;
            this.colaborador = this.createEmptyColaborador();
            this.formEmpresaId = null;
            await this.loadColaboradores();
        } catch (error) {
            console.error('Erro ao salvar colaborador:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar o colaborador.', life: 3000 });
        }
    }

    confirmDeleteColaborador(colaborador: Colaborador): void {
        this.colaborador = { ...colaborador };
        this.deleteColaboradorDialog = true;
    }

    async deleteColaborador(): Promise<void> {
        if (!this.colaborador.id) {
            return;
        }

        try {
            await this.colaboradorService.delete(this.colaborador.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Colaborador removido.', life: 3000 });
            this.deleteColaboradorDialog = false;
            this.colaborador = this.createEmptyColaborador();
            await this.loadColaboradores();
        } catch (error) {
            console.error('Erro ao excluir colaborador:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o colaborador.', life: 3000 });
        }
    }

    // --- Helpers de exibição ---

    filialLabel(colaborador: Colaborador): string {
        const filial = colaborador.filial;
        if (!filial) {
            return '—';
        }
        return filial.nome_fantasia || filial.razao_social || '—';
    }

    empresaLabel(colaborador: Colaborador): string {
        return colaborador.filial?.empresa?.nome || '—';
    }

    isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }
}
