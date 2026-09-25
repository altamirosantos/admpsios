import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import {
    APLICACAO_STATUS,
    AplicacaoNr1,
    AplicacaoNr1Service,
    AplicacaoStatus,
    TokenAplicacaoNr1
} from 'src/app/demo/service/aplicacao-nr1.service';
import { Cargo, CargoService } from 'src/app/demo/service/cargo.service';
import { Empresa, EmpresaService } from 'src/app/demo/service/empresa.service';
import { Filial, FilialService } from 'src/app/demo/service/filial.service';
import { Setor, SetorService } from 'src/app/demo/service/setor.service';

interface SelectOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-aplicacao-nr1-index',
    templateUrl: './aplicacao-nr1-index.component.html',
    styleUrl: './aplicacao-nr1-index.component.scss',
    providers: [MessageService]
})
export class AplicacaoNr1IndexComponent implements OnInit {
    aplicacoes: AplicacaoNr1[] = [];

    private empresas: Empresa[] = [];
    private filiais: Filial[] = [];
    private setores: Setor[] = [];
    private cargos: Cargo[] = [];

    empresaOptions: SelectOption[] = [];
    filialOptions: SelectOption[] = [];
    setorOptions: SelectOption[] = [];
    cargoOptions: SelectOption[] = [];

    aplicacaoDialog = false;
    loading = false;
    submitted = false;
    salvando = false;

    // Modelo do formulário do lote
    formEmpresaId: string | null = null;
    nome = '';
    filialId: string | null = null;
    setorId: string | null = null;
    cargoId: string | null = null;
    quantidadeColaboradores: number | null = null;
    /** Link do YouTube (vídeo explicativo exibido antes do questionário). */
    videoUrl: string | null = null;

    /**
     * Modo de geração:
     *  - 'COLABORADORES': 1 token por colaborador cadastrado na filial (permite e-mail).
     *  - 'QUANTIDADE': N tokens anônimos avulsos (sem vínculo/e-mail).
     */
    modoGeracao: 'COLABORADORES' | 'QUANTIDADE' = 'COLABORADORES';
    readonly modoOptions = [
        { label: 'Por colaboradores da filial (envia e-mail)', value: 'COLABORADORES' },
        { label: 'Por quantidade (tokens anônimos avulsos)', value: 'QUANTIDADE' }
    ];

    // Feedback pós-geração
    resultadoDialog = false;
    ultimoResultado: { nome: string; total: number } | null = null;

    // Links / tokens
    linksDialog = false;
    carregandoTokens = false;
    tokens: TokenAplicacaoNr1[] = [];
    aplicacaoLinks: AplicacaoNr1 | null = null;
    enviandoEmails = false;

    // QR code
    qrDialog = false;
    qrToken: TokenAplicacaoNr1 | null = null;

    // Link único da aplicação
    linkAplicacaoDialog = false;
    aplicacaoParaLink: AplicacaoNr1 | null = null;

    // QR code único da aplicação
    qrAplicacaoDialog = false;
    aplicacaoParaQr: AplicacaoNr1 | null = null;

    // Edição de status
    statusDialog = false;
    salvandoStatus = false;
    aplicacaoEmEdicao: AplicacaoNr1 | null = null;
    novoStatus: AplicacaoStatus = 'GERADO';
    readonly statusOptions = APLICACAO_STATUS.map((status) => ({
        label: this.statusLabel(status),
        value: status
    }));

    constructor(
        private readonly messageService: MessageService,
        private readonly aplicacaoService: AplicacaoNr1Service,
        private readonly empresaService: EmpresaService,
        private readonly filialService: FilialService,
        private readonly setorService: SetorService,
        private readonly cargoService: CargoService
    ) {}

    ngOnInit(): void {
        void this.loadAplicacoes();
        void this.loadOptions();
    }

    async loadAplicacoes(): Promise<void> {
        this.loading = true;

        try {
            this.aplicacoes = await this.aplicacaoService.getAll();
        } catch (error) {
            console.error('Erro ao carregar aplicações NR-1:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as aplicações.', life: 3000 });
        } finally {
            this.loading = false;
        }
    }

    async loadOptions(): Promise<void> {
        try {
            const [empresas, filiais, setores, cargos] = await Promise.all([
                this.empresaService.getAll(),
                this.filialService.getAll(),
                this.setorService.getAll(),
                this.cargoService.getAll()
            ]);

            this.empresas = empresas;
            this.filiais = filiais;
            this.setores = setores;
            this.cargos = cargos;

            this.empresaOptions = empresas
                .filter((empresa): empresa is Empresa & { id: string } => !!empresa.id)
                .map((empresa) => ({ label: empresa.nome, value: empresa.id }));
        } catch (error) {
            console.error('Erro ao carregar opções de empresa/filial/setor/cargo:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar empresas, filiais, setores e cargos.', life: 3000 });
        }
    }

    /** Ao trocar a empresa, recarrega as opções dependentes (filial/setor/cargo) e limpa seleções. */
    onEmpresaChange(): void {
        this.filialId = null;
        this.setorId = null;
        this.cargoId = null;

        this.filialOptions = this.filiaisDaEmpresa(this.formEmpresaId);
        this.setorOptions = this.setoresDaEmpresa(this.formEmpresaId);
        this.cargoOptions = this.cargosDaEmpresa(this.formEmpresaId);
    }

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

    private setoresDaEmpresa(empresaId: string | null): SelectOption[] {
        if (!empresaId) {
            return [];
        }
        return this.setores
            .filter((setor): setor is Setor & { id: string } => !!setor.id && setor.empresa_id === empresaId)
            .map((setor) => ({ label: setor.nome, value: setor.id }));
    }

    private cargosDaEmpresa(empresaId: string | null): SelectOption[] {
        if (!empresaId) {
            return [];
        }
        return this.cargos
            .filter((cargo): cargo is Cargo & { id: string } => !!cargo.id && cargo.empresa_id === empresaId)
            .map((cargo) => ({ label: cargo.nome, value: cargo.id }));
    }

    openNew(): void {
        if (this.empresaOptions.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Cadastre uma empresa e uma filial antes de gerar aplicações.', life: 4000 });
            return;
        }

        this.formEmpresaId = null;
        this.nome = '';
        this.filialId = null;
        this.setorId = null;
        this.cargoId = null;
        this.quantidadeColaboradores = null;
        this.videoUrl = null;
        this.modoGeracao = 'COLABORADORES';
        this.filialOptions = [];
        this.setorOptions = [];
        this.cargoOptions = [];
        this.submitted = false;
        this.aplicacaoDialog = true;
    }

    hideDialog(): void {
        this.aplicacaoDialog = false;
        this.submitted = false;
    }

    async gerarAplicacao(): Promise<void> {
        this.submitted = true;

        // Validação comum + específica por modo.
        if (!this.nome?.trim() || !this.filialId) {
            return;
        }
        if (this.modoGeracao === 'QUANTIDADE' && (!this.quantidadeColaboradores || this.quantidadeColaboradores < 1)) {
            return;
        }

        this.salvando = true;

        try {
            let nomeResultado: string;
            let total: number;

            const videoUrl = this.videoUrl?.trim() || null;

            if (this.modoGeracao === 'COLABORADORES') {
                const r = await this.aplicacaoService.gerarAplicacaoPorColaboradores(this.nome.trim(), this.filialId, 'GERADO', videoUrl);
                nomeResultado = r.nome;
                total = r.total_tokens;
                const semEmail = r.total_sem_email
                    ? ` (${r.total_sem_email} sem e-mail cadastrado)`
                    : '';
                this.messageService.add({
                    severity: 'success',
                    summary: 'Aplicação gerada',
                    detail: `${total} token(s) por colaborador${semEmail}.`,
                    life: 4000
                });
            } else {
                const r = await this.aplicacaoService.gerarAplicacaoComTokens({
                    nome: this.nome.trim(),
                    filial_id: this.filialId,
                    quantidade_colaboradores: this.quantidadeColaboradores!,
                    setor_id: this.setorId,
                    cargo_id: this.cargoId,
                    video_url: videoUrl
                });
                nomeResultado = r.nome;
                total = r.total_tokens;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Aplicação gerada',
                    detail: `${total} token(s) de acesso criados.`,
                    life: 4000
                });
            }

            this.aplicacaoDialog = false;
            this.ultimoResultado = { nome: nomeResultado, total };
            this.resultadoDialog = true;

            await this.loadAplicacoes();
        } catch (error) {
            console.error('Erro ao gerar aplicação NR-1:', error);
            const detail = error instanceof Error ? error.message : 'Não foi possível gerar a aplicação.';
            this.messageService.add({ severity: 'error', summary: 'Erro', detail, life: 5000 });
        } finally {
            this.salvando = false;
        }
    }

    // --- Helpers de exibição ---

    filialLabel(aplicacao: AplicacaoNr1): string {
        const filial = aplicacao.filial;
        if (!filial) {
            return '—';
        }
        return filial.nome_fantasia || filial.razao_social || '—';
    }

    empresaLabel(aplicacao: AplicacaoNr1): string {
        return aplicacao.filial?.empresa?.nome || '—';
    }

    statusLabel(status: string): string {
        const labels: Record<string, string> = {
            GERADO: 'Gerado',
            ATIVO: 'Ativo',
            ENCERRADO: 'Encerrado',
            CANCELADO: 'Cancelado'
        };
        return labels[status] || status;
    }

    statusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
            GERADO: 'warning',
            ATIVO: 'success',
            ENCERRADO: 'secondary',
            CANCELADO: 'danger'
        };
        return map[status] || 'secondary';
    }

    // --- Links / tokens ---

    /** Base pública usada para montar os links (origem atual do app). */
    get baseUrl(): string {
        return window.location.origin;
    }

    linkDoToken(token: string): string {
        return `${this.baseUrl}/pesquisa/nr1/${token}`;
    }

    /** URL da aplicação (acesso intermediário com CPF) */
    linkAcessoAplicacao(aplicacaoId: string): string {
        return `${this.baseUrl}/aplicacao/nr1/${aplicacaoId}`;
    }

    /** URL de imagem PNG do QR code do link (via serviço público, sem dependências). */
    qrCodeUrl(token: string, tamanho = 220): string {
        const link = encodeURIComponent(this.linkDoToken(token));
        return `https://api.qrserver.com/v1/create-qr-code/?size=${tamanho}x${tamanho}&margin=8&data=${link}`;
    }

    /** QR code da aplicação (acesso intermediário) */
    qrCodeAplicacao(aplicacaoId: string, tamanho = 220): string {
        const link = encodeURIComponent(this.linkAcessoAplicacao(aplicacaoId));
        return `https://api.qrserver.com/v1/create-qr-code/?size=${tamanho}x${tamanho}&margin=8&data=${link}`;
    }

    /** Abre o QR ampliado de um token. */
    abrirQrCode(t: TokenAplicacaoNr1): void {
        this.qrToken = t;
        this.qrDialog = true;
    }

    /** Baixa o PNG do QR code atual. */
    baixarQrCode(): void {
        if (!this.qrToken) {
            return;
        }
        const nome = (this.qrToken.colaborador_nome || 'colaborador').replace(/[^\w\-]+/g, '_');
        const a = document.createElement('a');
        a.href = this.qrCodeUrl(this.qrToken.token, 600);
        a.download = `qrcode-nr1-${nome}.png`;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /** Abre diálogo com o link único da aplicação */
    abrirLinkAplicacao(aplicacao: AplicacaoNr1): void {
        this.aplicacaoParaLink = aplicacao;
        this.linkAplicacaoDialog = true;
    }

    /** Abre diálogo com o QR code único da aplicação */
    abrirQrAplicacao(aplicacao: AplicacaoNr1): void {
        this.aplicacaoParaQr = aplicacao;
        this.qrAplicacaoDialog = true;
    }

    /** Copia o link da aplicação para a área de transferência */
    async copiarLinkAplicacao(): Promise<void> {
        if (!this.aplicacaoParaLink?.id) {
            return;
        }
        const link = this.linkAcessoAplicacao(this.aplicacaoParaLink.id);
        await this.copiar(link);
    }

    /** Baixa o PNG do QR code da aplicação */
    baixarQrAplicacao(): void {
        if (!this.aplicacaoParaQr?.id) {
            return;
        }
        const nome = (this.aplicacaoParaQr.nome || 'aplicacao').replace(/[^\w\-]+/g, '_');
        const a = document.createElement('a');
        a.href = this.qrCodeAplicacao(this.aplicacaoParaQr.id, 600);
        a.download = `qrcode-aplicacao-nr1-${nome}.png`;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    async abrirLinks(aplicacao: AplicacaoNr1): Promise<void> {
        if (!aplicacao.id) {
            return;
        }

        this.aplicacaoLinks = aplicacao;
        this.tokens = [];
        this.linksDialog = true;
        this.carregandoTokens = true;

        try {
            this.tokens = await this.aplicacaoService.listarTokens(aplicacao.id);
        } catch (error) {
            console.error('Erro ao carregar tokens:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os links.', life: 3000 });
        } finally {
            this.carregandoTokens = false;
        }
    }

    async copiar(texto: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(texto);
            this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Link copiado para a área de transferência.', life: 2000 });
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Não foi possível copiar automaticamente.', life: 3000 });
        }
    }

    async copiarTodos(): Promise<void> {
        const linhas = this.tokens.map((t) => {
            const quem = t.colaborador_nome || t.email || 'colaborador';
            return `${quem}: ${this.linkDoToken(t.token)}`;
        });
        await this.copiar(linhas.join('\n'));
    }

    async enviarEmails(reenviar = false): Promise<void> {
        if (!this.aplicacaoLinks?.id) {
            return;
        }

        this.enviandoEmails = true;

        try {
            const r = await this.aplicacaoService.enviarLinksPorEmail(this.aplicacaoLinks.id, this.baseUrl, reenviar);
            const detalhe = `${r.enviados} e-mail(s) enviado(s).` +
                (r.semEmail ? ` ${r.semEmail} sem e-mail.` : '') +
                (r.falhas?.length ? ` ${r.falhas.length} falha(s).` : '');
            this.messageService.add({
                severity: r.falhas?.length ? 'warn' : 'success',
                summary: 'Envio concluído',
                detail: detalhe,
                life: 5000
            });
        } catch (error) {
            console.error('Erro ao enviar e-mails:', error);
            const detail = error instanceof Error ? error.message : 'Não foi possível enviar os e-mails.';
            this.messageService.add({ severity: 'error', summary: 'Erro', detail, life: 5000 });
        } finally {
            this.enviandoEmails = false;
        }
    }

    get totalComEmail(): number {
        return this.tokens.filter((t) => !!t.email).length;
    }

    // --- Edição de status ---

    editarStatus(aplicacao: AplicacaoNr1): void {
        this.aplicacaoEmEdicao = aplicacao;
        this.novoStatus = (aplicacao.status as AplicacaoStatus) || 'GERADO';
        this.statusDialog = true;
    }

    async salvarStatus(): Promise<void> {
        if (!this.aplicacaoEmEdicao?.id) {
            return;
        }

        this.salvandoStatus = true;

        try {
            await this.aplicacaoService.atualizarStatus(this.aplicacaoEmEdicao.id, this.novoStatus);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Status atualizado.', life: 3000 });
            this.statusDialog = false;
            this.aplicacaoEmEdicao = null;
            await this.loadAplicacoes();
        } catch (error) {
            console.error('Erro ao atualizar status da aplicação:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível atualizar o status.', life: 3000 });
        } finally {
            this.salvandoStatus = false;
        }
    }
}
