import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { Empresa, EmpresaService } from 'src/app/demo/service/empresa.service';
import {
    ModeloProposta,
    ModeloPropostaService,
    ParametroSchema,
    ParametroTipo
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
export class PropostaEmpresaIndexComponent implements OnInit, OnDestroy {
    propostas: PropostaEmpresa[] = [];
    empresaOptions: SelectOption[] = [];
    modeloOptions: SelectOption[] = [];

    /** Estado do modal de prévia da proposta em tela cheia. */
    previewDialog = false;
    previewUrl: SafeResourceUrl | null = null;
    private previewObjectUrl: string | null = null;

    /** Modelos carregados (com parametros_schema) para derivar os campos de parâmetro. */
    private modelos: ModeloProposta[] = [];

    /** Definição dos parâmetros do modelo selecionado (para renderizar os campos). */
    parametrosDefinicao: ParametroSchema[] = [];

    /**
     * Chaves preenchidas automaticamente pela própria proposta (não pedem input do usuário):
     * nome da empresa selecionada e data da proposta (data atual).
     */
    private readonly autoParametros = new Set(['empresa', 'empresa_nome', 'data', 'data_proposta']);

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
        private readonly servicoPropostaEmpresaService: ServicoPropostaEmpresaService,
        private readonly sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        void this.loadPropostas();
        void this.loadOptions();
    }

    ngOnDestroy(): void {
        this.revokePreview();
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
        if (modelo.nome?.trim()) {
            return modelo.nome.trim();
        }
        // fallback para modelos sem nome (dados antigos): usa trecho do conteúdo
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
        // Oculta dos campos os parâmetros preenchidos automaticamente (empresa e data da proposta).
        this.parametrosDefinicao = modelo
            ? modelo.parametros_schema.filter((def) => !this.isAutoParametro(def.chave))
            : [];

        const novosParametros: Record<string, string | number | null> = {};
        for (const def of this.parametrosDefinicao) {
            novosParametros[def.chave] = resetValues
                ? null
                : this.proposta.parametros?.[def.chave] ?? null;
        }
        this.proposta.parametros = novosParametros;
    }

    /** Indica se a chave é preenchida automaticamente (não deve virar campo de input). */
    private isAutoParametro(chave: string): boolean {
        return this.autoParametros.has(chave.trim().toLowerCase());
    }

    // --- Pré-visualização da proposta ---

    /** Abre a prévia da proposta com os campos-chave preenchidos, em tela cheia. */
    visualizarProposta(): void {
        const modelo = this.modelos.find((m) => m.id === this.proposta.modelo_proposta_id);

        if (!modelo) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um modelo de proposta para pré-visualizar.', life: 3500 });
            return;
        }

        if (!modelo.content?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'O modelo selecionado não possui conteúdo para pré-visualizar.', life: 3500 });
            return;
        }

        const html = this.aplicarTokens(modelo.content, this.montarTokens());
        this.gerarPreview(html);
        this.previewDialog = true;
    }

    /** Monta o mapa de tokens (chave -> valor exibível) com base nos campos preenchidos. */
    private montarTokens(): Record<string, string> {
        const tokens: Record<string, string> = {};

        // parâmetros declarados no modelo
        for (const def of this.parametrosDefinicao) {
            const bruto = this.proposta.parametros?.[def.chave];
            tokens[def.chave] = this.formatarValorParametro(bruto, def.tipo);
        }

        // tokens preenchidos automaticamente (têm precedência): nome da empresa e data da proposta
        const empresa = this.empresaOptions.find((e) => e.value === this.proposta.empresa_id);
        const hoje = this.formatarDataBr(new Date());
        tokens['empresa'] = empresa?.label ?? '';
        tokens['empresa_nome'] = empresa?.label ?? '';
        tokens['data'] = hoje;
        tokens['data_proposta'] = hoje;

        // demais tokens derivados dos campos-chave da proposta
        tokens['status'] = this.statusLabel(this.proposta.status);
        tokens['valor'] = this.proposta.valor != null ? this.formatarMoeda(this.proposta.valor) : '';
        tokens['validade'] = this.validade ? this.formatarDataBr(this.validade) : '';
        tokens['vigencia'] = this.proposta.vigencia != null ? String(this.proposta.vigencia) : '';
        tokens['servicos'] = this.montarListaServicos();

        return tokens;
    }

    /** Substitui as ocorrências de ${chave} no conteúdo pelos valores informados. */
    private aplicarTokens(content: string, tokens: Record<string, string>): string {
        return content.replace(/\$\{\s*([a-zA-Z0-9_]+)\s*\}/g, (match, chave: string) => {
            const valor = tokens[chave];
            // mantém o token original quando não há valor definido, para evidenciar o que falta
            if (valor === undefined) {
                return match;
            }
            return valor.length > 0 ? valor : match;
        });
    }

    private montarListaServicos(): string {
        const itens = this.servicoItens
            .filter((item) => item.servico_proposta_id)
            .map((item) => {
                const servico = this.servicoOptions.find((s) => s.value === item.servico_proposta_id);
                const nome = servico?.label ?? 'Serviço';
                const qtde = item.qtde && item.qtde > 0 ? item.qtde : 1;
                return `<li>${qtde}x ${nome}</li>`;
            });

        return itens.length > 0 ? `<ul>${itens.join('')}</ul>` : '';
    }

    private formatarValorParametro(valor: string | number | null | undefined, tipo: ParametroTipo): string {
        if (valor === null || valor === undefined || valor === '') {
            return '';
        }

        switch (tipo) {
            case 'moeda': {
                const numero = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(',', '.'));
                return Number.isFinite(numero) ? this.formatarMoeda(numero) : String(valor);
            }
            case 'data': {
                const data = this.parseDate(String(valor));
                return isNaN(data.getTime()) ? String(valor) : this.formatarDataBr(data);
            }
            default:
                return String(valor);
        }
    }

    private formatarMoeda(valor: number): string {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    private formatarDataBr(date: Date): string {
        const day = `${date.getDate()}`.padStart(2, '0');
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        return `${day}/${month}/${date.getFullYear()}`;
    }

    /** Gera a prévia fiel via Blob URL + iframe (documento HTML completo). */
    private gerarPreview(html: string): void {
        this.revokePreview();
        const conteudo = html || '<p style="font-family:sans-serif;color:#888;padding:24px">Sem conteúdo para pré-visualizar.</p>';
        const blob = new Blob([conteudo], { type: 'text/html;charset=utf-8' });
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl);
    }

    fecharPreview(): void {
        this.previewDialog = false;
        this.revokePreview();
    }

    private revokePreview(): void {
        if (this.previewObjectUrl) {
            URL.revokeObjectURL(this.previewObjectUrl);
            this.previewObjectUrl = null;
        }
        this.previewUrl = null;
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
