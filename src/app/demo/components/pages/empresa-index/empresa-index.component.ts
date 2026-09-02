import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Empresa, EmpresaService } from 'src/app/demo/service/empresa.service';

@Component({
    selector: 'app-empresa-index',
    templateUrl: './empresa-index.component.html',
    styleUrl: './empresa-index.component.scss',
    providers: [MessageService]
})
export class EmpresaIndexComponent implements OnInit {
    empresas: Empresa[] = [];
    empresaDialog = false;
    deleteEmpresaDialog = false;
    loading = false;
    submitted = false;

    empresa: Empresa = this.createEmptyEmpresa();
    dataFundacao: Date | null = null;
    maxDate = new Date();

    constructor(
        private readonly messageService: MessageService,
        private readonly empresaService: EmpresaService
    ) {}

    ngOnInit(): void {
        void this.loadEmpresas();
    }

    createEmptyEmpresa(): Empresa {
        return {
            nome: '',
            data_fundacao: null,
            email: null
        };
    }

    async loadEmpresas(): Promise<void> {
        this.loading = true;

        try {
            this.empresas = await this.empresaService.getAll();
        } catch (error) {
            console.error('Erro ao carregar empresas:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as empresas.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    openNew(): void {
        this.empresa = this.createEmptyEmpresa();
        this.dataFundacao = null;
        this.submitted = false;
        this.empresaDialog = true;
    }

    editEmpresa(empresa: Empresa): void {
        this.empresa = { ...empresa };
        this.dataFundacao = empresa.data_fundacao ? this.parseDate(empresa.data_fundacao) : null;
        this.submitted = false;
        this.empresaDialog = true;
    }

    hideDialog(): void {
        this.empresaDialog = false;
        this.submitted = false;
    }

    async saveEmpresa(): Promise<void> {
        this.submitted = true;

        if (!this.empresa.nome?.trim()) {
            return;
        }

        if (this.empresa.email && !this.isValidEmail(this.empresa.email)) {
            return;
        }

        const payload = {
            nome: this.empresa.nome.trim(),
            data_fundacao: this.dataFundacao ? this.formatDate(this.dataFundacao) : null,
            email: this.empresa.email?.trim() || null
        };

        try {
            if (this.empresa.id) {
                await this.empresaService.update(this.empresa.id, payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Empresa atualizada.', life: 3000 });
            } else {
                await this.empresaService.create(payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Empresa criada.', life: 3000 });
            }

            this.empresaDialog = false;
            this.empresa = this.createEmptyEmpresa();
            this.dataFundacao = null;
            await this.loadEmpresas();
        } catch (error) {
            console.error('Erro ao salvar empresa:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar a empresa.', life: 3000 });
        }
    }

    confirmDeleteEmpresa(empresa: Empresa): void {
        this.empresa = { ...empresa };
        this.deleteEmpresaDialog = true;
    }

    async deleteEmpresa(): Promise<void> {
        if (!this.empresa.id) {
            return;
        }

        try {
            await this.empresaService.delete(this.empresa.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Empresa removida.', life: 3000 });
            this.deleteEmpresaDialog = false;
            this.empresa = this.createEmptyEmpresa();
            await this.loadEmpresas();
        } catch (error) {
            console.error('Erro ao excluir empresa:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir a empresa. Verifique se não há filiais vinculadas.', life: 4000 });
        }
    }

    isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    /** Converte um Date para string ISO no formato de data (YYYY-MM-DD), sem componente de fuso. */
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /** Converte uma string de data (YYYY-MM-DD) para Date local, evitando shift de fuso. */
    private parseDate(value: string): Date {
        const [year, month, day] = value.split('T')[0].split('-').map((part) => parseInt(part, 10));
        return new Date(year, (month || 1) - 1, day || 1);
    }
}
