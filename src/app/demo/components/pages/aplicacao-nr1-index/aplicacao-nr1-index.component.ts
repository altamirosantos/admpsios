import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AplicacaoNr1, AplicacaoNr1Service } from 'src/app/demo/service/aplicacao-nr1.service';
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

    // Feedback pós-geração
    resultadoDialog = false;
    ultimoResultado: { nome: string; total: number } | null = null;

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

        if (!this.nome?.trim() || !this.filialId || !this.quantidadeColaboradores || this.quantidadeColaboradores < 1) {
            return;
        }

        this.salvando = true;

        try {
            const resultado = await this.aplicacaoService.gerarAplicacaoComTokens({
                nome: this.nome.trim(),
                filial_id: this.filialId,
                quantidade_colaboradores: this.quantidadeColaboradores,
                setor_id: this.setorId,
                cargo_id: this.cargoId
            });

            this.aplicacaoDialog = false;
            this.ultimoResultado = { nome: resultado.nome, total: resultado.total_tokens };
            this.resultadoDialog = true;

            this.messageService.add({
                severity: 'success',
                summary: 'Aplicação gerada',
                detail: `${resultado.total_tokens} token(s) de acesso criados.`,
                life: 4000
            });

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

    statusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
            GERADO: 'secondary',
            PENDENTE: 'warning',
            EM_ANDAMENTO: 'info',
            CONCLUIDA: 'success',
            CANCELADA: 'danger'
        };
        return map[status] || 'secondary';
    }
}
