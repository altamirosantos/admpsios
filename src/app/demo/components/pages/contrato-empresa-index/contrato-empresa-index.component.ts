import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import {
    CONTRATO_STATUS,
    ContratoEmpresa,
    ContratoEmpresaService,
    ContratoStatus
} from 'src/app/demo/service/contrato-empresa.service';
import { Empresa, EmpresaService } from 'src/app/demo/service/empresa.service';
import { Modelo, ModeloService, ParametroSchema, ParametroTipo } from 'src/app/demo/service/modelo.service';

interface SelectOption<T = string> {
    label: string;
    value: T;
}

@Component({
    selector: 'app-contrato-empresa-index',
    templateUrl: './contrato-empresa-index.component.html',
    styleUrl: './contrato-empresa-index.component.scss',
    providers: [MessageService]
})
export class ContratoEmpresaIndexComponent implements OnInit, OnDestroy {
    contratos: ContratoEmpresa[] = [];
    empresaOptions: SelectOption[] = [];
    modeloOptions: SelectOption[] = [];

    /** Estado do modal de prévia do contrato em tela cheia. */
    previewDialog = false;
    previewUrl: SafeResourceUrl | null = null;
    private previewObjectUrl: string | null = null;

    @ViewChild('previewIframe') previewIframe?: ElementRef<HTMLIFrameElement>;

    /** Modelos de contrato carregados (com parametros_schema). */
    private modelos: Modelo[] = [];

    /** Definição dos parâmetros do modelo selecionado. */
    parametrosDefinicao: ParametroSchema[] = [];

    /** Chaves preenchidas automaticamente (não pedem input). */
    private readonly autoParametros = new Set(['empresa', 'empresa_nome', 'data', 'data_contrato', 'data_proposta']);

    contratoDialog = false;
    deleteContratoDialog = false;
    loading = false;
    submitted = false;

    contrato: ContratoEmpresa = this.createEmptyContrato();
    validade: Date | null = null;

    readonly statusOptions: SelectOption<ContratoStatus>[] = CONTRATO_STATUS.map((status) => ({
        label: this.statusLabel(status),
        value: status
    }));

    constructor(
        private readonly messageService: MessageService,
        private readonly contratoService: ContratoEmpresaService,
        private readonly empresaService: EmpresaService,
        private readonly modeloService: ModeloService,
        private readonly sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        void this.loadContratos();
        void this.loadOptions();
    }

    ngOnDestroy(): void {
        this.revokePreview();
    }

    createEmptyContrato(): ContratoEmpresa {
        return {
            empresa_id: '',
            modelo_id: null,
            status: 'RASCUNHO',
            validade: null,
            vigencia: null,
            parametros: {},
            valor: null
        };
    }

    async loadContratos(): Promise<void> {
        this.loading = true;

        try {
            this.contratos = await this.contratoService.getAll();
        } catch (error) {
            console.error('Erro ao carregar contratos:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os contratos.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    async loadOptions(): Promise<void> {
        try {
            const [empresas, modelos] = await Promise.all([
                this.empresaService.getAll(),
                this.modeloService.getAtivos('CONTRATO')
            ]);

            this.empresaOptions = empresas
                .filter((empresa): empresa is Empresa & { id: string } => !!empresa.id)
                .map((empresa) => ({ label: empresa.nome, value: empresa.id }));

            this.modelos = modelos;
            this.modeloOptions = modelos
                .filter((modelo): modelo is Modelo & { id: string } => !!modelo.id)
                .map((modelo, index) => ({ label: this.modeloLabel(modelo, index), value: modelo.id }));
        } catch (error) {
            console.error('Erro ao carregar opções de empresa/modelo:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar empresas e modelos de contrato.', life: 3000 });
        }
    }

    private modeloLabel(modelo: Modelo, index: number): string {
        if (modelo.nome?.trim()) {
            return modelo.nome.trim();
        }
        const shortId = modelo.id ? modelo.id.substring(0, 8) : `${index + 1}`;
        return `Modelo ${shortId}`;
    }

    openNew(): void {
        if (this.empresaOptions.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Cadastre uma empresa antes de criar contratos.', life: 4000 });
            return;
        }

        this.contrato = this.createEmptyContrato();
        this.validade = null;
        this.parametrosDefinicao = [];
        this.submitted = false;
        this.contratoDialog = true;
    }

    editContrato(contrato: ContratoEmpresa): void {
        this.contrato = { ...contrato, parametros: { ...contrato.parametros } };
        this.validade = contrato.validade ? this.parseDate(contrato.validade) : null;
        this.applyModeloParametros(contrato.modelo_id, false);
        this.submitted = false;
        this.contratoDialog = true;
    }

    hideDialog(): void {
        this.contratoDialog = false;
        this.submitted = false;
    }

    onModeloChange(): void {
        this.applyModeloParametros(this.contrato.modelo_id, true);
    }

    private applyModeloParametros(modeloId: string | null, resetValues: boolean): void {
        const modelo = this.modelos.find((m) => m.id === modeloId);
        this.parametrosDefinicao = modelo
            ? modelo.parametros_schema.filter((def) => !this.isAutoParametro(def.chave))
            : [];

        const novosParametros: Record<string, string | number | null> = {};
        for (const def of this.parametrosDefinicao) {
            novosParametros[def.chave] = resetValues ? null : this.contrato.parametros?.[def.chave] ?? null;
        }
        this.contrato.parametros = novosParametros;
    }

    private isAutoParametro(chave: string): boolean {
        return this.autoParametros.has(chave.trim().toLowerCase());
    }

    // --- Parâmetros booleanos (blocos liga/desliga) ---

    isBlocoAtivo(chave: string): boolean {
        return this.tokenVerdadeiro(this.contrato.parametros?.[chave]);
    }

    setBlocoAtivo(chave: string, ativo: boolean): void {
        if (!this.contrato.parametros) {
            this.contrato.parametros = {};
        }
        this.contrato.parametros[chave] = ativo ? 'true' : 'false';
    }

    // --- Pré-visualização / PDF ---

    visualizarContrato(): void {
        const modelo = this.modelos.find((m) => m.id === this.contrato.modelo_id);
        if (!modelo) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um modelo de contrato para pré-visualizar.', life: 3500 });
            return;
        }
        if (!modelo.content?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'O modelo selecionado não possui conteúdo.', life: 3500 });
            return;
        }

        const html = this.aplicarTokens(modelo.content, this.montarTokens());
        this.gerarPreview(html);
        this.previewDialog = true;
    }

    async visualizarContratoDaGrid(contrato: ContratoEmpresa): Promise<void> {
        const modelo = this.modelos.find((m) => m.id === contrato.modelo_id);
        if (!modelo) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Este contrato não possui um modelo ativo vinculado para pré-visualizar.', life: 4000 });
            return;
        }
        if (!modelo.content?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'O modelo vinculado não possui conteúdo.', life: 3500 });
            return;
        }

        this.contrato = { ...contrato, parametros: { ...(contrato.parametros ?? {}) } };
        this.validade = contrato.validade ? this.parseDate(contrato.validade) : null;
        this.parametrosDefinicao = modelo.parametros_schema.filter((def) => !this.isAutoParametro(def.chave));

        const html = this.aplicarTokens(modelo.content, this.montarTokens());
        this.gerarPreview(html);
        this.previewDialog = true;
    }

    private montarTokens(): Record<string, string> {
        const tokens: Record<string, string> = {};

        for (const def of this.parametrosDefinicao) {
            tokens[def.chave] = this.formatarValorParametro(this.contrato.parametros?.[def.chave], def.tipo);
        }

        const empresa = this.empresaOptions.find((e) => e.value === this.contrato.empresa_id);
        const hoje = this.formatarDataBr(new Date());
        tokens['empresa'] = empresa?.label ?? '';
        tokens['empresa_nome'] = empresa?.label ?? '';
        tokens['data'] = hoje;
        tokens['data_contrato'] = hoje;
        tokens['data_proposta'] = hoje;
        tokens['status'] = this.statusLabel(this.contrato.status);
        tokens['valor'] = this.contrato.valor != null ? this.formatarMoeda(this.contrato.valor) : '';
        tokens['validade'] = this.validade ? this.formatarDataBr(this.validade) : '';
        tokens['vigencia'] = this.contrato.vigencia != null ? String(this.contrato.vigencia) : '';

        return tokens;
    }

    private aplicarTokens(content: string, tokens: Record<string, string>): string {
        const resultado = this.aplicarBlocosCondicionais(content, tokens);
        return resultado.replace(/\$\{\s*([a-zA-Z0-9_]+)\s*\}/g, (match, chave: string) => {
            const valor = tokens[chave];
            if (valor === undefined) {
                return match;
            }
            return valor.length > 0 ? valor : match;
        });
    }

    private aplicarBlocosCondicionais(content: string, tokens: Record<string, string>): string {
        const bloco = /\$\{([#^])\s*([a-zA-Z0-9_]+)\s*\}([\s\S]*?)\$\{\/\s*\2\s*\}/g;
        let anterior: string;
        let atual = content;
        do {
            anterior = atual;
            atual = atual.replace(bloco, (_match, tipo: string, chave: string, interno: string) => {
                const ativo = this.tokenVerdadeiro(tokens[chave]);
                const incluir = tipo === '#' ? ativo : !ativo;
                return incluir ? interno : '';
            });
        } while (atual !== anterior);
        return atual;
    }

    private tokenVerdadeiro(valor: string | number | null | undefined): boolean {
        if (valor === undefined || valor === null) {
            return false;
        }
        const v = String(valor).trim().toLowerCase();
        if (v === '') {
            return false;
        }
        return !['false', 'nao', 'não', '0', 'off', 'no'].includes(v);
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

    private gerarPreview(html: string): void {
        this.revokePreview();
        const conteudo = html || '<p style="font-family:sans-serif;color:#888;padding:24px">Sem conteúdo para pré-visualizar.</p>';
        const blob = new Blob([conteudo], { type: 'text/html;charset=utf-8' });
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl);
    }

    baixarPdf(): void {
        const win = this.previewIframe?.nativeElement?.contentWindow;
        if (!win) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'A pré-visualização ainda está carregando. Tente novamente.', life: 3000 });
            return;
        }
        try {
            win.focus();
            win.print();
        } catch (error) {
            console.error('Erro ao acionar a impressão do contrato:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível abrir a impressão.', life: 3000 });
        }
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

    async saveContrato(): Promise<void> {
        this.submitted = true;

        if (!this.contrato.empresa_id) {
            return;
        }

        const payload = {
            empresa_id: this.contrato.empresa_id,
            modelo_id: this.contrato.modelo_id || null,
            status: this.contrato.status,
            validade: this.validade ? this.formatDate(this.validade) : null,
            vigencia: this.contrato.vigencia ?? null,
            parametros: this.contrato.parametros || {},
            valor: this.contrato.valor ?? null
        };

        try {
            if (this.contrato.id) {
                await this.contratoService.update(this.contrato.id, payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Contrato atualizado.', life: 3000 });
            } else {
                await this.contratoService.create(payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Contrato criado.', life: 3000 });
            }

            this.contratoDialog = false;
            this.contrato = this.createEmptyContrato();
            this.validade = null;
            await this.loadContratos();
        } catch (error) {
            console.error('Erro ao salvar contrato:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar o contrato.', life: 3000 });
        }
    }

    confirmDeleteContrato(contrato: ContratoEmpresa): void {
        this.contrato = { ...contrato };
        this.deleteContratoDialog = true;
    }

    async deleteContrato(): Promise<void> {
        if (!this.contrato.id) {
            return;
        }

        try {
            await this.contratoService.delete(this.contrato.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Contrato removido.', life: 3000 });
            this.deleteContratoDialog = false;
            this.contrato = this.createEmptyContrato();
            await this.loadContratos();
        } catch (error) {
            console.error('Erro ao excluir contrato:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o contrato.', life: 3000 });
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

    chaveToken(chave: string): string {
        return '${' + chave + '}';
    }

    statusLabel(status: ContratoStatus): string {
        const labels: Record<ContratoStatus, string> = {
            RASCUNHO: 'Rascunho',
            ENVIADO: 'Enviado',
            ASSINADO: 'Assinado',
            CANCELADO: 'Cancelado',
            ENCERRADO: 'Encerrado'
        };
        return labels[status] || status;
    }

    statusSeverity(status: ContratoStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
        const severities: Record<ContratoStatus, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
            RASCUNHO: 'secondary',
            ENVIADO: 'info',
            ASSINADO: 'success',
            CANCELADO: 'danger',
            ENCERRADO: 'warning'
        };
        return severities[status] || 'secondary';
    }
}
