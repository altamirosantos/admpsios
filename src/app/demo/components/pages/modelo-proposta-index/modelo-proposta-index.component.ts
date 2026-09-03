import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { html as cmHtml } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
import { MessageService } from 'primeng/api';
import {
    MODELO_PROPOSTA_STATUS,
    ModeloProposta,
    ModeloPropostaService,
    ModeloPropostaStatus,
    ParametroSchema,
    ParametroTipo
} from 'src/app/demo/service/modelo-proposta.service';

interface StatusOption {
    label: string;
    value: ModeloPropostaStatus;
}

interface TipoOption {
    label: string;
    value: ParametroTipo;
}

@Component({
    selector: 'app-modelo-proposta-index',
    templateUrl: './modelo-proposta-index.component.html',
    styleUrl: './modelo-proposta-index.component.scss',
    providers: [MessageService]
})
export class ModeloPropostaIndexComponent implements OnInit, AfterViewInit, OnDestroy {
    modelos: ModeloProposta[] = [];
    modeloDialog = false;
    deleteModeloDialog = false;
    loading = false;
    submitted = false;

    modelo: ModeloProposta = this.createEmptyModelo();

    readonly statusOptions: StatusOption[] = MODELO_PROPOSTA_STATUS.map((status) => ({
        label: this.statusLabel(status),
        value: status
    }));

    readonly tipoOptions: TipoOption[] = [
        { label: 'Texto', value: 'texto' },
        { label: 'Número', value: 'numero' },
        { label: 'Data', value: 'data' },
        { label: 'Moeda', value: 'moeda' }
    ];

    /** Container do editor CodeMirror. */
    @ViewChild('cmHost') cmHost?: ElementRef<HTMLDivElement>;
    private cmView: EditorView | null = null;

    /** Estado do modal de prévia em tela cheia. */
    previewDialog = false;
    previewUrl: SafeResourceUrl | null = null;
    private previewObjectUrl: string | null = null;

    constructor(
        private readonly messageService: MessageService,
        private readonly modeloPropostaService: ModeloPropostaService,
        private readonly sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        void this.loadModelos();
    }

    ngAfterViewInit(): void {
        // o editor é (re)criado quando o diálogo abre; nada a fazer aqui.
    }

    ngOnDestroy(): void {
        this.destroyEditor();
        this.revokePreview();
    }

    createEmptyModelo(): ModeloProposta {
        return {
            nome: null,
            status: 'ATIVO',
            content: null,
            parametros_schema: []
        };
    }

    async loadModelos(): Promise<void> {
        this.loading = true;

        try {
            this.modelos = await this.modeloPropostaService.getAll();
        } catch (error) {
            console.error('Erro ao carregar modelos de proposta:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os modelos de proposta.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    openNew(): void {
        this.modelo = this.createEmptyModelo();
        this.submitted = false;
        this.modeloDialog = true;
    }

    editModelo(modelo: ModeloProposta): void {
        this.modelo = {
            ...modelo,
            parametros_schema: modelo.parametros_schema.map((param) => ({ ...param }))
        };
        this.submitted = false;
        this.modeloDialog = true;
    }

    hideDialog(): void {
        this.modeloDialog = false;
        this.submitted = false;
        this.destroyEditor();
    }

    // --- CodeMirror ---

    /** Chamado quando o conteúdo do diálogo é renderizado (onShow do p-dialog). */
    onDialogShow(): void {
        this.initEditor();
    }

    private initEditor(): void {
        this.destroyEditor();

        if (!this.cmHost) {
            // aguarda o próximo ciclo caso o container ainda não exista
            setTimeout(() => this.initEditor(), 0);
            return;
        }

        const updateListener = EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                this.modelo.content = update.state.doc.toString();
            }
        });

        const state = EditorState.create({
            doc: this.modelo.content || '',
            extensions: [
                basicSetup,
                cmHtml(),
                oneDark,
                EditorView.lineWrapping,
                updateListener
            ]
        });

        this.cmView = new EditorView({
            state,
            parent: this.cmHost.nativeElement
        });
    }

    private destroyEditor(): void {
        if (this.cmView) {
            this.cmView.destroy();
            this.cmView = null;
        }
    }

    /** Insere um texto na posição atual do cursor do CodeMirror. */
    private insertNoEditor(texto: string): void {
        if (!this.cmView) {
            this.modelo.content = `${this.modelo.content || ''}${texto}`;
            return;
        }

        const view = this.cmView;
        const pos = view.state.selection.main.head;
        view.dispatch({
            changes: { from: pos, insert: texto },
            selection: { anchor: pos + texto.length }
        });
        view.focus();
        this.modelo.content = view.state.doc.toString();
    }

    // --- Parâmetros ---

    addParametro(): void {
        this.modelo.parametros_schema = [
            ...this.modelo.parametros_schema,
            { chave: '', label: '', tipo: 'texto' }
        ];
    }

    removeParametro(index: number): void {
        this.modelo.parametros_schema = this.modelo.parametros_schema.filter((_, i) => i !== index);
    }

    /** Normaliza a chave para um identificador válido (minúsculas, sem espaços/acentos). */
    onChaveChange(param: ParametroSchema): void {
        param.chave = param.chave
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .toLowerCase();
    }

    hasDuplicateKeys(): boolean {
        const chaves = this.modelo.parametros_schema
            .map((p) => p.chave.trim())
            .filter((c) => c.length > 0);
        return new Set(chaves).size !== chaves.length;
    }

    insertChave(param: ParametroSchema): void {
        if (!param.chave?.trim()) {
            return;
        }
        this.insertNoEditor('${' + param.chave.trim() + '}');
    }

    // --- Importação de HTML pronto ---

    openImportarHtml(): void {
        // abre o seletor de arquivo é feito pelo input file no template; aqui não é necessário estado extra
    }

    /** Carrega o conteúdo de um arquivo .html selecionado para dentro do editor. */
    onArquivoSelecionado(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const conteudo = String(reader.result ?? '');
            this.setEditorContent(conteudo);
            this.messageService.add({ severity: 'success', summary: 'HTML importado', detail: `Arquivo "${file.name}" carregado.`, life: 2500 });
        };
        reader.onerror = () => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível ler o arquivo.', life: 3000 });
        };
        reader.readAsText(file);

        // permite reselecionar o mesmo arquivo depois
        input.value = '';
    }

    /** Substitui todo o conteúdo do editor (cru, sem sanitizar). */
    private setEditorContent(html: string): void {
        this.modelo.content = html;
        if (this.cmView) {
            this.cmView.dispatch({
                changes: { from: 0, to: this.cmView.state.doc.length, insert: html }
            });
        }
    }

    // --- Prévia em tela cheia ---

    abrirPreview(): void {
        this.gerarPreview(this.modelo.content || '');
        this.previewDialog = true;
    }

    /** Gera a prévia fiel de um HTML (usado tanto no editor quanto na grade). */
    private gerarPreview(html: string): void {
        this.revokePreview();
        const conteudo = html || '<p style="font-family:sans-serif;color:#888;padding:24px">Sem conteúdo para pré-visualizar.</p>';
        const blob = new Blob([conteudo], { type: 'text/html;charset=utf-8' });
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl);
    }

    previewFromGrid(modelo: ModeloProposta): void {
        this.gerarPreview(modelo.content || '');
        this.previewDialog = true;
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

    async saveModelo(): Promise<void> {
        this.submitted = true;

        if (!this.modelo.nome?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o nome do modelo.', life: 3000 });
            return;
        }

        const parametrosInvalidos = this.modelo.parametros_schema.some((p) => !p.chave?.trim());
        if (parametrosInvalidos || this.hasDuplicateKeys()) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Revise os parâmetros: cada parâmetro precisa de uma chave única.', life: 4000 });
            return;
        }

        // garante que o content reflete o editor atual
        if (this.cmView) {
            this.modelo.content = this.cmView.state.doc.toString();
        }

        const payload = {
            nome: this.modelo.nome.trim(),
            status: this.modelo.status,
            content: this.modelo.content?.trim() || null,
            parametros_schema: this.modelo.parametros_schema.map((p) => ({
                chave: p.chave.trim(),
                label: p.label?.trim() || p.chave.trim(),
                tipo: p.tipo
            }))
        };

        try {
            if (this.modelo.id) {
                await this.modeloPropostaService.update(this.modelo.id, payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Modelo de proposta atualizado.', life: 3000 });
            } else {
                await this.modeloPropostaService.create(payload);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Modelo de proposta criado.', life: 3000 });
            }

            this.modeloDialog = false;
            this.destroyEditor();
            this.modelo = this.createEmptyModelo();
            await this.loadModelos();
        } catch (error) {
            console.error('Erro ao salvar modelo de proposta:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar o modelo de proposta.', life: 3000 });
        }
    }

    confirmDeleteModelo(modelo: ModeloProposta): void {
        this.modelo = { ...modelo };
        this.deleteModeloDialog = true;
    }

    async deleteModelo(): Promise<void> {
        if (!this.modelo.id) {
            return;
        }

        try {
            await this.modeloPropostaService.delete(this.modelo.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Modelo de proposta removido.', life: 3000 });
            this.deleteModeloDialog = false;
            this.modelo = this.createEmptyModelo();
            await this.loadModelos();
        } catch (error) {
            console.error('Erro ao excluir modelo de proposta:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o modelo. Verifique se não há propostas vinculadas.', life: 4000 });
        }
    }

    // --- UI helpers ---

    /** Monta o token de exibição da chave (evita ${ literal no template). */
    chaveToken(chave: string): string {
        return '${' + chave + '}';
    }

    /** Remove tags HTML e limita o texto para a prévia na grade. */
    stripHtmlPreview(content: string | null): string {
        if (!content) {
            return '—';
        }
        const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (!text) {
            return '—';
        }
        return text.length > 90 ? `${text.substring(0, 90)}…` : text;
    }

    statusLabel(status: ModeloPropostaStatus): string {
        const labels: Record<ModeloPropostaStatus, string> = {
            ATIVO: 'Ativo',
            INATIVO: 'Inativo'
        };
        return labels[status] || status;
    }

    statusSeverity(status: ModeloPropostaStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
        const severities: Record<ModeloPropostaStatus, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
            ATIVO: 'success',
            INATIVO: 'secondary'
        };
        return severities[status] || 'secondary';
    }
}
