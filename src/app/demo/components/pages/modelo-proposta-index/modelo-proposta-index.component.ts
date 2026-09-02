import { Component, OnInit } from '@angular/core';
import {
    Alignment,
    Autoformat,
    BlockQuote,
    Bold,
    ClassicEditor,
    type EditorConfig,
    Essentials,
    FontColor,
    Heading,
    Indent,
    Italic,
    Link,
    List,
    Paragraph,
    RemoveFormat,
    Table,
    TableToolbar,
    Underline
} from 'ckeditor5';
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
export class ModeloPropostaIndexComponent implements OnInit {
    modelos: ModeloProposta[] = [];
    modeloDialog = false;
    deleteModeloDialog = false;
    loading = false;
    submitted = false;

    modelo: ModeloProposta = this.createEmptyModelo();

    /** Classe do editor CKEditor 5 usada pelo componente <ckeditor>. */
    readonly Editor = ClassicEditor;

    /** Configuração do CKEditor 5 (self-hosted, licença GPL open source). */
    readonly editorConfig: EditorConfig = {
        licenseKey: 'GPL',
        plugins: [
            Essentials,
            Paragraph,
            Heading,
            Bold,
            Italic,
            Underline,
            FontColor,
            Link,
            List,
            Indent,
            BlockQuote,
            Alignment,
            Table,
            TableToolbar,
            Autoformat,
            RemoveFormat
        ],
        toolbar: {
            items: [
                'undo', 'redo',
                '|', 'heading',
                '|', 'bold', 'italic', 'underline', 'fontColor',
                '|', 'link', 'blockQuote', 'insertTable',
                '|', 'bulletedList', 'numberedList', 'outdent', 'indent',
                '|', 'alignment',
                '|', 'removeFormat'
            ],
            shouldNotGroupWhenFull: true
        },
        table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
        },
        placeholder: 'Escreva o conteúdo da proposta. Use os parâmetros ${chave} para valores dinâmicos.'
    };

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

    /** Instância ativa do CKEditor, usada para inserir chaves na posição do cursor. */
    private editorInstance: ClassicEditor | null = null;

    constructor(
        private readonly messageService: MessageService,
        private readonly modeloPropostaService: ModeloPropostaService
    ) {}

    ngOnInit(): void {
        void this.loadModelos();
    }

    createEmptyModelo(): ModeloProposta {
        return {
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

    // --- Editor / inserção de chave ---

    onEditorReady(editor: ClassicEditor): void {
        this.editorInstance = editor;
    }

    insertChave(param: ParametroSchema): void {
        if (!param.chave?.trim()) {
            return;
        }

        const token = '${' + param.chave.trim() + '}';

        if (this.editorInstance) {
            const editor = this.editorInstance;
            editor.model.change((writer) => {
                const insertPosition = editor.model.document.selection.getFirstPosition();
                if (insertPosition) {
                    writer.insertText(token, insertPosition);
                }
            });
            editor.editing.view.focus();
            this.modelo.content = editor.getData();
        } else {
            this.modelo.content = `${this.modelo.content || ''} ${token}`;
        }
    }

    async saveModelo(): Promise<void> {
        this.submitted = true;

        const parametrosInvalidos = this.modelo.parametros_schema.some((p) => !p.chave?.trim());
        if (parametrosInvalidos || this.hasDuplicateKeys()) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Revise os parâmetros: cada parâmetro precisa de uma chave única.', life: 4000 });
            return;
        }

        const payload = {
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
