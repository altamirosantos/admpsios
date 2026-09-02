import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Empresa, EmpresaService } from 'src/app/demo/service/empresa.service';
import {
    ModeloProposta,
    ModeloPropostaService,
    ParametroSchema
} from 'src/app/demo/service/modelo-proposta.service';
import {
    PROPOSTA_STATUS,
    PropostaEmpresa,
    PropostaEmpresaService,
    PropostaStatus
} from 'src/app/demo/service/proposta-empresa.service';
import { ServicoPropostaEmpresaService } from 'src/app/demo/service/servico-proposta-empresa.service';
import { ServicoProposta, ServicosPropostaService } from 'src/app/demo/service/servicos-proposta.service';

interface SelectOption<T = string> {
    label: string;
    value: T;
}

/** Linha da área de serviços da proposta (1..n). */
interface ServicoLinha {
    servico_proposta_id: string | null;
    qtde: number;
}

@Component({
    selector: 'app-proposta-empresa-index',
    templateUrl: './proposta-empresa-index.component.html',
    styleUrl: './proposta-empresa-index.component.scss',
    providers: [MessageService]
})
export class PropostaEmpresaIndexComponent implements OnInit {
    propostas: PropostaEmpresa[] = [];
    empresaOptions: SelectOption[] = [];
    modeloOptions: SelectOption[] = [];

    /** Modelos carregados (com parametros_schema) para derivar os campos de parâmetro. */
    private modelos: ModeloProposta[] = [];

    /** Definição dos parâmetros do modelo selecionado (para renderizar os campos). */
    parametrosDefinicao: ParametroSchema[] = [];

    /** Opções de serviços ativos para a área de serviços da proposta. */
    servicoOptions: SelectOption[] = [];

    /** Linhas de serviços vinculados à proposta em edição (1..n). */
    servicoItens: ServicoLinha[] = [];

    propostaDialog = false;
    deletePropostaDialog = false;
    loading = false;
    submitted = false;

    proposta: PropostaEmpresa = this.createEmptyProposta();
    validade: Date | null = null;

    readonly statusOptions: SelectOption<PropostaStatus>[] = PROPOSTA_STATUS.map((status) => ({
        label: this.statusLabel(status),
        value: status
    }));

    constructor(
        private readonly messageService: MessageService,
        private readonly propostaService: PropostaEmpresaService,
        private readonly empresaService: EmpresaService,
        private readonly modeloPropostaService: ModeloPropostaService,
        private readonly servicosService: ServicosPropostaService,
        private readonly servicoPropostaEmpresaService: ServicoPropostaEmpresaService
    ) {}

    ngOnInit(): void {
        void this.loadPropostas();
        void this.loadOptions();
    }

    createEmptyProposta(): PropostaEmpresa {
        return {
            empresa_id: '',
            modelo_proposta_id: null,
            status: 'RASCUNHO',
            validade: null,
            vigencia: null,
            parametros: {},
            valor: null
        };
    }

    async loadPropostas(): Promise<void> {
        this.loading = true;

        try {
            this.propostas = await this.propostaService.getAll();
        } catch (error) {
            console.error('Erro ao carregar propostas:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as propostas.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    async loadOptions(): Promise<void> {
        try {
            const [empresas, modelos, servicos] = await Promise.all([
                this.empresaService.getAll(),
                this.modeloPropostaService.getAtivos(),
                this.servicosService.getAtivos()
            ]);

            this.empresaOptions = empresas
                .filter((empresa): empresa is Empresa & { id: string } => !!empresa.id)
                .map((empresa) => ({ label: empresa.nome, value: empresa.id }));

            this.modelos = modelos;
            this.modeloOptions = modelos
                .filter((modelo): modelo is ModeloProposta & { id: string } => !!modelo.id)
                .map((modelo, index) => ({
                    label: this.modeloLabel(modelo, index),
                    value: modelo.id
                }));

            this.servicoOptions = servicos
                .filter((servico): servico is ServicoProposta & { id: string } => !!servico.id)
                .map((servico) => ({ label: servico.nome, value: servico.id }));
        } catch (error) {
            console.error('Erro ao carregar opções de empresa/modelo/serviço:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar empresas, modelos e serviços.', life: 3000 });
        }
    }

    private modeloLabel(modelo: ModeloProposta, index: number): string {
        const preview = (modelo.content || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const shortId = modelo.id ? modelo.id.substring(0, 8) : `${index + 1}`;
        return preview ? `${preview.substring(0, 40)} (${shortId})` : `Modelo ${shortId}`;
    }

    openNew(): void {
        if (this.empresaOptions.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Cadastre uma empresa antes de criar propostas.', life: 4000 });
            return;
        }

        this.proposta = this.createEmptyProposta();
        this.validade = null;
        this.parametrosDefinicao = [];
        this.servicoItens = [];
        this.submitted = false;
        this.propostaDialog = true;
    }

    editProposta(proposta: PropostaEmpresa): void {
        this.proposta = {
            ...proposta,
            parametros: { ...proposta.parametros }
        };
        this.validade = proposta.validade ? this.parseDate(proposta.validade) : null;
        this.applyModeloParametros(proposta.modelo_proposta_id, false);
        this.servicoItens = [];
        this.submitted = false;
        this.propostaDialog = true;

        if (proposta.id) {
            void this.loadServicoItens(proposta.id);
        }
    }

    private async loadServicoItens(propostaId: string): Promise<void> {
        try {
            const itens = await this.servicoPropostaEmpresaService.getByProposta(propostaId);
            this.servicoItens = itens.map((item) => ({
                servico_proposta_id: item.servico_proposta_id,
                qtde: item.qtde ?? 1
            }));
        } catch (error) {
            console.error('Erro ao carregar serviços da proposta:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os serviços da proposta.', life: 3000 });
        }
    }

    // --- Serviços da proposta (1..n) ---

    addServicoItem(): void {
        this.servicoItens = [...this.servicoItens, { servico_proposta_id: null, qtde: 1 }];
    }

    removeServicoItem(index: number): void {
        this.servicoItens = this.servicoItens.filter((_, i) => i !== index);
    }

    hasDuplicateServicos(): boolean {
        const ids = this.servicoItens
            .map((item) => item.servico_proposta_id)
            .filter((id): id is string => !!id);
        return new Set(ids).size !== ids.length;
    }

    hideDialog(): void {
        this.propostaDialog = false;
        this.submitted = false;
    }

    /** Ao trocar o modelo, deriva os parâmetros e reseta os valores quando limpar dados. */
    onModeloChange(): void {
        this.applyModeloParametros(this.proposta.modelo_proposta_id, true);
    }

    private applyModeloParametros(modeloId: string | null, resetValues: boolean): void {
        const modelo = this.modelos.find((m) => m.id === modeloId);
        this.parametrosDefinicao = modelo ? modelo.parametros_schema : [];

        const novosParametros: Record<string, string | number | null> = {};
        for (const def of this.parametrosDefinicao) {
            novosParametros[def.chave] = resetValues
                ? null
                : this.proposta.parametros?.[def.chave] ?? null;
        }
        this.proposta.parametros = novosParametros;
    }

    async saveProposta(): Promise<void> {
        this.submitted = true;

        if (!this.proposta.empresa_id) {
            return;
        }

        // valida serviços: cada linha precisa de serviço selecionado e não pode repetir
        const servicosInvalidos = this.servicoItens.some((item) => !item.servico_proposta_id);
        if (servicosInvalidos || this.hasDuplicateServicos()) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Revise os serviços: selecione um serviço em cada linha, sem repetições.', life: 4000 });
            return;
        }

        const payload = {
            empresa_id: this.proposta.empresa_id,
            modelo_proposta_id: this.proposta.modelo_proposta_id || null,
            status: this.proposta.status,
            validade: this.validade ? this.formatDate(this.validade) : null,
            vigencia: this.proposta.vigencia ?? null,
            parametros: this.proposta.parametros || {},
            valor: this.proposta.valor ?? null
        };

        try {
            let propostaId: string;

            if (this.proposta.id) {
                const atualizada = await this.propostaService.update(this.proposta.id, payload);
                propostaId = atualizada.id ?? this.proposta.id;
            } else {
                const criada = await this.propostaService.create(payload);
                propostaId = criada.id as string;
            }

            // sincroniza os serviços vinculados à proposta
            await this.servicoPropostaEmpresaService.syncItens(
                propostaId,
                this.servicoItens
                    .filter((item) => item.servico_proposta_id)
                    .map((item) => ({
                        servico_proposta_id: item.servico_proposta_id as string,
                        qtde: item.qtde && item.qtde > 0 ? item.qtde : 1
                    }))
            );

            this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: this.proposta.id ? 'Proposta atualizada.' : 'Proposta criada.',
                life: 3000
            });

            this.propostaDialog = false;
            this.proposta = this.createEmptyProposta();
            this.validade = null;
            this.servicoItens = [];
            await this.loadPropostas();
        } catch (error) {
            console.error('Erro ao salvar proposta:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar a proposta.', life: 3000 });
        }
    }

    confirmDeleteProposta(proposta: PropostaEmpresa): void {
        this.proposta = { ...proposta };
        this.deletePropostaDialog = true;
    }

    async deleteProposta(): Promise<void> {
        if (!this.proposta.id) {
            return;
        }

        try {
            await this.propostaService.delete(this.proposta.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Proposta removida.', life: 3000 });
            this.deletePropostaDialog = false;
            this.proposta = this.createEmptyProposta();
            await this.loadPropostas();
        } catch (error) {
            console.error('Erro ao excluir proposta:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir a proposta.', life: 3000 });
        }
    }

    // --- Datas ---

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

    // --- UI helpers ---

    /** Monta o token de exibição da chave (evita ${ literal no template). */
    chaveToken(chave: string): string {
        return '${' + chave + '}';
    }

    statusLabel(status: PropostaStatus): string {
        const labels: Record<PropostaStatus, string> = {
            RASCUNHO: 'Rascunho',
            ENVIADA: 'Enviada',
            APROVADA: 'Aprovada',
            REJEITADA: 'Rejeitada',
            CANCELADA: 'Cancelada'
        };
        return labels[status] || status;
    }

    statusSeverity(status: PropostaStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
        const severities: Record<PropostaStatus, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
            RASCUNHO: 'secondary',
            ENVIADA: 'info',
            APROVADA: 'success',
            REJEITADA: 'danger',
            CANCELADA: 'warning'
        };
        return severities[status] || 'secondary';
    }
}
