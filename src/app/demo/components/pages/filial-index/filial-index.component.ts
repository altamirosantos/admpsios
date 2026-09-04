import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Empresa, EmpresaService } from 'src/app/demo/service/empresa.service';
import { Filial, FilialService } from 'src/app/demo/service/filial.service';

interface EmpresaOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-filial-index',
    templateUrl: './filial-index.component.html',
    styleUrl: './filial-index.component.scss',
    providers: [MessageService]
})
export class FilialIndexComponent implements OnInit {
    filiais: Filial[] = [];
    empresaOptions: EmpresaOption[] = [];
    filialDialog = false;
    deleteFilialDialog = false;
    loading = false;
    submitted = false;

    filial: Filial = this.createEmptyFilial();
    dataFundacao: Date | null = null;
    maxDate = new Date();

    constructor(
        private readonly messageService: MessageService,
        private readonly filialService: FilialService,
        private readonly empresaService: EmpresaService
    ) {}

    ngOnInit(): void {
        void this.loadFiliais();
        void this.loadEmpresaOptions();
    }

    createEmptyFilial(): Filial {
        return {
            empresa_id: '',
            razao_social: null,
            nome_fantasia: null,
            data_fundacao: null,
            cnpj: null,
            email: null,
            total_colaboradores: null
        };
    }

    async loadFiliais(): Promise<void> {
        this.loading = true;

        try {
            this.filiais = await this.filialService.getAll();
        } catch (error) {
            console.error('Erro ao carregar filiais:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as filiais.', life: 3000 });
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

    openNew(): void {
        if (this.empresaOptions.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Cadastre uma empresa antes de criar filiais.', life: 4000 });
            return;
        }

        this.filial = this.createEmptyFilial();
        this.dataFundacao = null;
        this.submitted = false;
        this.filialDialog = true;
    }

    editFilial(filial: Filial): void {
        this.filial = { ...filial };
        this.dataFundacao = filial.data_fundacao ? this.parseDate(filial.data_fundacao) : null;
        this.submitted = false;
        this.filialDialog = true;
    }

    hideDialog(): void {
        this.filialDialog = false;
        this.submitted = false;
    }

    async saveFilial(): Promise<void> {
        this.submitted = true;

        if (!this.filial.empresa_id) {
            return;
        }

        if (this.filial.cnpj && !this.isValidCnpj(this.filial.cnpj)) {
            return;
        }

        if (this.filial.email && !this.isValidEmail(this.filial.email)) {
            return;
        }

        const payload = {
            empresa_id: this.filial.empresa_id,
            razao_social: this.filial.razao_social?.trim() || null,
            nome_fantasia: this.filial.nome_fantasia?.trim() || null,
            data_fundacao: this.dataFundacao ? this.formatDate(this.dataFundacao) : null,
            cnpj: this.filial.cnpj?.trim() || null,
            email: this.filial.email?.trim() || null,
            total_colaboradores: this.filial.total_colaboradores ?? null
        };

        try {
            if (this.filial.id) {
                await this.filialService.update(this.filial.id, payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Filial atualizada.', life: 3000 });
            } else {
                await this.filialService.create(payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Filial criada.', life: 3000 });
            }

            this.filialDialog = false;
            this.filial = this.createEmptyFilial();
            this.dataFundacao = null;
            await this.loadFiliais();
        } catch (error) {
            console.error('Erro ao salvar filial:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar a filial.', life: 3000 });
        }
    }

    confirmDeleteFilial(filial: Filial): void {
        this.filial = { ...filial };
        this.deleteFilialDialog = true;
    }

    async deleteFilial(): Promise<void> {
        if (!this.filial.id) {
            return;
        }

        try {
            await this.filialService.delete(this.filial.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Filial removida.', life: 3000 });
            this.deleteFilialDialog = false;
            this.filial = this.createEmptyFilial();
            await this.loadFiliais();
        } catch (error) {
            console.error('Erro ao excluir filial:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir a filial.', life: 3000 });
        }
    }

    isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    /** Valida CNPJ pelos dígitos verificadores (aceita valor com ou sem máscara). */
    isValidCnpj(value: string): boolean {
        const cnpj = value.replace(/\D/g, '');

        if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
            return false;
        }

        const calcCheckDigit = (base: string, weights: number[]): number => {
            const sum = base
                .split('')
                .reduce((acc, digit, index) => acc + parseInt(digit, 10) * weights[index], 0);
            const remainder = sum % 11;
            return remainder < 2 ? 0 : 11 - remainder;
        };

        const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        const firstDigit = calcCheckDigit(cnpj.substring(0, 12), firstWeights);
        const secondDigit = calcCheckDigit(cnpj.substring(0, 13), secondWeights);

        return firstDigit === parseInt(cnpj.charAt(12), 10) && secondDigit === parseInt(cnpj.charAt(13), 10);
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private parseDate(value: string): Date {
        const [year, month, day] = value.split('T')[0].split('-').map((part) => parseInt(part, 10));
        return new Date(year, (month || 1) - 1, day || 1);
    }
}
