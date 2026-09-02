import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import {
    SERVICO_PROPOSTA_STATUS,
    ServicoProposta,
    ServicoPropostaStatus,
    ServicosPropostaService
} from 'src/app/demo/service/servicos-proposta.service';

interface StatusOption {
    label: string;
    value: ServicoPropostaStatus;
}

@Component({
    selector: 'app-servicos-proposta-index',
    templateUrl: './servicos-proposta-index.component.html',
    styleUrl: './servicos-proposta-index.component.scss',
    providers: [MessageService]
})
export class ServicosPropostaIndexComponent implements OnInit {
    servicos: ServicoProposta[] = [];
    servicoDialog = false;
    deleteServicoDialog = false;
    loading = false;
    submitted = false;

    servico: ServicoProposta = this.createEmptyServico();

    readonly statusOptions: StatusOption[] = SERVICO_PROPOSTA_STATUS.map((status) => ({
        label: this.statusLabel(status),
        value: status
    }));

    constructor(
        private readonly messageService: MessageService,
        private readonly servicosService: ServicosPropostaService
    ) {}

    ngOnInit(): void {
        void this.loadServicos();
    }

    createEmptyServico(): ServicoProposta {
        return {
            status: 'ATIVO',
            nome: '',
            descricao: null
        };
    }

    async loadServicos(): Promise<void> {
        this.loading = true;

        try {
            this.servicos = await this.servicosService.getAll();
        } catch (error) {
            console.error('Erro ao carregar serviços de proposta:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os serviços.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    openNew(): void {
        this.servico = this.createEmptyServico();
        this.submitted = false;
        this.servicoDialog = true;
    }

    editServico(servico: ServicoProposta): void {
        this.servico = { ...servico };
        this.submitted = false;
        this.servicoDialog = true;
    }

    hideDialog(): void {
        this.servicoDialog = false;
        this.submitted = false;
    }

    async saveServico(): Promise<void> {
        this.submitted = true;

        if (!this.servico.nome?.trim()) {
            return;
        }

        const payload = {
            status: this.servico.status,
            nome: this.servico.nome.trim(),
            descricao: this.servico.descricao?.trim() || null
        };

        try {
            if (this.servico.id) {
                await this.servicosService.update(this.servico.id, payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Serviço atualizado.', life: 3000 });
            } else {
                await this.servicosService.create(payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Serviço criado.', life: 3000 });
            }

            this.servicoDialog = false;
            this.servico = this.createEmptyServico();
            await this.loadServicos();
        } catch (error) {
            console.error('Erro ao salvar serviço de proposta:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar o serviço.', life: 3000 });
        }
    }

    confirmDeleteServico(servico: ServicoProposta): void {
        this.servico = { ...servico };
        this.deleteServicoDialog = true;
    }

    async deleteServico(): Promise<void> {
        if (!this.servico.id) {
            return;
        }

        try {
            await this.servicosService.delete(this.servico.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Serviço removido.', life: 3000 });
            this.deleteServicoDialog = false;
            this.servico = this.createEmptyServico();
            await this.loadServicos();
        } catch (error) {
            console.error('Erro ao excluir serviço de proposta:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o serviço. Verifique se não está vinculado a propostas.', life: 4000 });
        }
    }

    statusLabel(status: ServicoPropostaStatus): string {
        return status === 'ATIVO' ? 'Ativo' : 'Inativo';
    }

    statusSeverity(status: ServicoPropostaStatus): 'success' | 'secondary' {
        return status === 'ATIVO' ? 'success' : 'secondary';
    }
}
