import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AplicacaoNr1, AplicacaoNr1Service } from 'src/app/demo/service/aplicacao-nr1.service';
import {
    ComparativoSetor,
    MetricaFatorRisco,
    MetricasNr1Service,
    ResumoMetricasNr1,
    RiscoClasse,
    SetorRespondido
} from 'src/app/demo/service/metricas-nr1.service';

interface SelectOption {
    label: string;
    value: string;
}

/** Paleta fixa por classificação (verde/amarelo/vermelho/preto). */
const COR_BAIXO = '#22c55e';   // verde
const COR_MEDIO = '#eab308';   // amarelo
const COR_ALTO = '#ef4444';    // vermelho
const COR_CRITICO = '#111827'; // preto
const COR_PENDENTE = '#9ca3af'; // cinza

/** Opções de probabilidade (avaliação qualitativa do psicólogo). */
const PROBABILIDADE_OPTIONS: SelectOption[] = [
    { label: '1 - Baixa', value: '1' },
    { label: '2 - Média', value: '2' },
    { label: '3 - Alta', value: '3' }
];

@Component({
    selector: 'app-nr1-dashboard-index',
    templateUrl: './nr1-dashboard-index.component.html',
    styleUrl: './nr1-dashboard-index.component.scss',
    providers: [MessageService]
})
export class Nr1DashboardIndexComponent implements OnInit {
    /** Aplicações (lotes) disponíveis para análise. */
    aplicacaoOptions: SelectOption[] = [];
    aplicacaoSelecionadaId: string | null = null;
    aplicacaoSelecionada: AplicacaoNr1 | null = null;

    resumo: ResumoMetricasNr1 | null = null;

    /** Resumo SEM filtro (empresa como um todo) — usado na pizza "Gravidade Geral". */
    resumoGeral: ResumoMetricasNr1 | null = null;

    /** Filtro por setor (slicer da planilha). null = visão geral (todos os setores). */
    setorOptions: SelectOption[] = [];
    setorSelecionadoId: string | null = null;

    loadingAplicacoes = false;
    loadingMetricas = false;
    /** Guarda qual tópico está com probabilidade sendo salva (para desabilitar o dropdown). */
    salvandoProbabilidade: string | null = null;

    readonly probabilidadeOptions = PROBABILIDADE_OPTIONS;

    // Dados do gráfico (gravidade média por tópico)
    chartData: any;
    chartOptions: any;

    // Comparativo entre setores (independe do filtro de setor)
    comparativoSetores: ComparativoSetor[] = [];
    chartSetoresData: any;
    chartSetoresOptions: any;

    // Gráficos de pizza (painel resumo): Matriz de Risco, Gravidade por Setor, Gravidade Geral
    pieOptions: any;
    pieRiscoData: any;
    pieGravidadeSetorData: any;
    pieGravidadeGeralData: any;

    private aplicacoes: AplicacaoNr1[] = [];

    constructor(
        private readonly messageService: MessageService,
        private readonly aplicacaoService: AplicacaoNr1Service,
        private readonly metricasService: MetricasNr1Service
    ) {}

    ngOnInit(): void {
        this.initChartOptions();
        void this.loadAplicacoes();
    }

    async loadAplicacoes(): Promise<void> {
        this.loadingAplicacoes = true;

        try {
            this.aplicacoes = await this.aplicacaoService.getAll();
            this.aplicacaoOptions = this.aplicacoes
                .filter((a): a is AplicacaoNr1 & { id: string } => !!a.id)
                .map((a) => ({ label: this.aplicacaoLabel(a), value: a.id }));
        } catch (error) {
            console.error('Erro ao carregar aplicações NR-1:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as aplicações.', life: 3000 });
        } finally {
            this.loadingAplicacoes = false;
        }
    }

    async onAplicacaoChange(): Promise<void> {
        this.resumo = null;
        this.resumoGeral = null;
        this.setorSelecionadoId = null;
        this.setorOptions = [];
        this.comparativoSetores = [];
        this.chartSetoresData = null;
        this.aplicacaoSelecionada = this.aplicacoes.find((a) => a.id === this.aplicacaoSelecionadaId) ?? null;

        if (!this.aplicacaoSelecionadaId) {
            return;
        }

        await this.carregarSetores();
        await this.carregarResumoGeral();
        await this.carregarComparativoSetores();
        await this.carregarMetricas();
    }

    /** Carrega o resumo da empresa como um todo (sem filtro de setor) — base da "Gravidade Geral". */
    private async carregarResumoGeral(): Promise<void> {
        if (!this.aplicacaoSelecionadaId) {
            return;
        }

        try {
            this.resumoGeral = await this.metricasService.calcularMetricas(this.aplicacaoSelecionadaId, null);
        } catch (error) {
            console.error('Erro ao carregar resumo geral:', error);
            this.resumoGeral = null;
        }
    }

    /** Carrega o comparativo entre setores (independe do filtro de setor). */
    private async carregarComparativoSetores(): Promise<void> {
        if (!this.aplicacaoSelecionadaId) {
            return;
        }

        try {
            this.comparativoSetores = await this.metricasService.comparativoPorSetor(this.aplicacaoSelecionadaId);
            this.atualizarGraficoSetores();
            this.atualizarPizzas();
        } catch (error) {
            console.error('Erro ao carregar comparativo por setor:', error);
            this.comparativoSetores = [];
            this.chartSetoresData = null;
        }
    }

    /** Muda o setor filtrado e recalcula (mantém a aplicação). */
    async onSetorChange(): Promise<void> {
        await this.carregarMetricas();
    }

    private async carregarSetores(): Promise<void> {
        if (!this.aplicacaoSelecionadaId) {
            return;
        }

        try {
            const setores: SetorRespondido[] = await this.metricasService.listarSetores(this.aplicacaoSelecionadaId);
            this.setorOptions = [
                { label: 'Todos os setores (visão geral)', value: '' },
                ...setores.map((s) => ({ label: `${s.setor_nome} (${s.total_respondentes})`, value: s.setor_id }))
            ];
        } catch (error) {
            console.error('Erro ao carregar setores respondidos:', error);
            this.setorOptions = [{ label: 'Todos os setores (visão geral)', value: '' }];
        }
    }

    async carregarMetricas(): Promise<void> {
        if (!this.aplicacaoSelecionadaId) {
            return;
        }

        this.loadingMetricas = true;

        try {
            const setorId = this.setorSelecionadoId || null;
            this.resumo = await this.metricasService.calcularMetricas(this.aplicacaoSelecionadaId, setorId);
            this.atualizarGrafico();
        } catch (error) {
            console.error('Erro ao calcular métricas NR-1:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível calcular as métricas.', life: 3000 });
        } finally {
            this.loadingMetricas = false;
        }
    }

    /** Salva a probabilidade escolhida para um tópico e recalcula a matriz. */
    async onProbabilidadeChange(topico: MetricaFatorRisco, valor: string | null): Promise<void> {
        if (!this.aplicacaoSelecionadaId || valor == null) {
            return;
        }

        const probabilidade = Number(valor);
        if (![1, 2, 3].includes(probabilidade)) {
            return;
        }

        this.salvandoProbabilidade = topico.fator_risco;

        try {
            await this.metricasService.salvarProbabilidade(
                this.aplicacaoSelecionadaId,
                topico.fator_risco,
                probabilidade,
                this.setorSelecionadoId || null
            );
            // Recalcula para refletir a matriz de risco atualizada (detalhe + comparativo).
            await this.carregarMetricas();
            await this.carregarComparativoSetores();
            this.messageService.add({ severity: 'success', summary: 'Probabilidade salva', detail: topico.fator_risco, life: 2500 });
        } catch (error) {
            console.error('Erro ao salvar probabilidade:', error);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar a probabilidade.', life: 3000 });
        } finally {
            this.salvandoProbabilidade = null;
        }
    }

    /** Gera o PDF/impressão do quadro atual (o psicólogo salva por setor). */
    exportarPdf(): void {
        window.print();
    }

    // --- Helpers de exibição ---

    /** Rótulo do setor filtrado (para o cabeçalho de impressão). */
    get setorSelecionadoLabel(): string {
        if (!this.setorSelecionadoId) {
            return 'Todos os setores (visão geral)';
        }
        return this.setorOptions.find((o) => o.value === this.setorSelecionadoId)?.label ?? '—';
    }

    aplicacaoLabel(a: AplicacaoNr1): string {
        const empresa = a.filial?.empresa?.nome;
        const setor = a.setor?.nome;
        const partes = [a.nome];
        if (setor) {
            partes.push(setor);
        }
        if (empresa) {
            partes.push(empresa);
        }
        return partes.filter(Boolean).join(' • ');
    }

    /** Valor atual da probabilidade como string (para o dropdown). */
    probabilidadeValor(topico: MetricaFatorRisco): string | null {
        return topico.probabilidade == null ? null : String(topico.probabilidade);
    }

    /** Classe CSS de cor para a tag de risco final (verde/amarelo/vermelho/preto). */
    riscoTagClass(classe: RiscoClasse): string {
        const map: Record<RiscoClasse, string> = {
            Baixo: 'tag-baixo',
            'Médio': 'tag-medio',
            Alto: 'tag-alto',
            'Crítico': 'tag-critico',
            Pendente: 'tag-pendente'
        };
        return map[classe] ?? 'tag-pendente';
    }

    /** Classe CSS de cor para a tag de gravidade/probabilidade (Baixa/Média/Alta). */
    nivelTagClass(classe: string | null): string {
        const map: Record<string, string> = {
            Baixa: 'tag-baixo',
            'Média': 'tag-medio',
            Alta: 'tag-alto'
        };
        return (classe && map[classe]) || 'tag-pendente';
    }

    private initChartOptions(): void {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dfe7ef';

        this.chartOptions = {
            indexAxis: 'y',
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: { labels: { color: textColor } }
            },
            scales: {
                x: {
                    min: 0,
                    max: 3,
                    ticks: { color: textColorSecondary, stepSize: 1 },
                    grid: { color: surfaceBorder }
                },
                y: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                }
            }
        };

        // Gráfico comparativo entre setores (barras verticais, escala 0..3).
        this.chartSetoresOptions = {
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor } }
            },
            scales: {
                x: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                },
                y: {
                    min: 0,
                    max: 3,
                    ticks: { color: textColorSecondary, stepSize: 1 },
                    grid: { color: surfaceBorder }
                }
            }
        };

        // Opções das pizzas (legenda embaixo; percentual no tooltip).
        this.pieOptions = {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: textColor } },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => {
                            const dados = ctx.dataset.data as number[];
                            const total = dados.reduce((a, b) => a + b, 0) || 1;
                            const valor = ctx.parsed as number;
                            const pct = Math.round((valor / total) * 100);
                            return `${ctx.label}: ${valor} (${pct}%)`;
                        }
                    }
                }
            }
        };
    }

    /** Cor por classe de gravidade (Baixa=verde, Média=amarelo, Alta=vermelho). */
    private corGravidade(classe: string): string {
        if (classe === 'Alta') {
            return COR_ALTO;
        }
        if (classe === 'Média') {
            return COR_MEDIO;
        }
        return COR_BAIXO;
    }

    /** Cor por classe de risco final (Baixo=verde/Médio=amarelo/Alto=vermelho/Crítico=preto). */
    private corRisco(classe: string): string {
        const map: Record<string, string> = {
            Baixo: COR_BAIXO,
            'Médio': COR_MEDIO,
            Alto: COR_ALTO,
            'Crítico': COR_CRITICO,
            Pendente: COR_PENDENTE
        };
        return map[classe] ?? COR_PENDENTE;
    }

    /** Monta os dados das 3 pizzas do painel resumo a partir do resumo do setor filtrado + comparativo. */
    private atualizarPizzas(): void {
        // 1) Matriz de Risco: distribuição do risco final dos tópicos do setor filtrado.
        this.pieRiscoData = this.resumo
            ? this.contarPizza(
                  this.resumo.topicos.map((t) => t.risco_classe),
                  ['Baixo', 'Médio', 'Alto', 'Crítico', 'Pendente'],
                  (c) => this.corRisco(c)
              )
            : null;

        // 2) Gravidade por Setor: distribuição da gravidade dos tópicos do setor filtrado.
        this.pieGravidadeSetorData = this.resumo
            ? this.contarPizza(
                  this.resumo.topicos.map((t) => t.gravidade_classe),
                  ['Baixa', 'Média', 'Alta'],
                  (c) => this.corGravidade(c)
              )
            : null;

        // 3) Gravidade Geral: empresa como um todo — distribuição da gravidade de
        //    TODOS os tópicos na visão sem filtro (todos os setores juntos).
        this.pieGravidadeGeralData = this.resumoGeral
            ? this.contarPizza(
                  this.resumoGeral.topicos.map((t) => t.gravidade_classe),
                  ['Baixa', 'Média', 'Alta'],
                  (c) => this.corGravidade(c)
              )
            : null;
    }

    /** Conta ocorrências de cada classe e monta o dataset de pizza (ignora classes com contagem 0). */
    private contarPizza(
        classes: string[],
        ordem: string[],
        corFn: (classe: string) => string
    ): any {
        const contagem = new Map<string, number>();
        for (const c of classes) {
            contagem.set(c, (contagem.get(c) ?? 0) + 1);
        }
        const labels: string[] = [];
        const data: number[] = [];
        const cores: string[] = [];
        for (const classe of ordem) {
            const n = contagem.get(classe) ?? 0;
            if (n > 0) {
                labels.push(classe);
                data.push(n);
                cores.push(corFn(classe));
            }
        }
        return {
            labels,
            datasets: [{ data, backgroundColor: cores, borderColor: '#ffffff', borderWidth: 1 }]
        };
    }

    private atualizarGraficoSetores(): void {
        if (!this.comparativoSetores.length) {
            this.chartSetoresData = null;
            return;
        }

        const labels = this.comparativoSetores.map((s) => s.setor_nome);
        const valores = this.comparativoSetores.map((s) => s.gravidade_media);
        const cores = this.comparativoSetores.map((s) => this.corGravidade(s.gravidade_classe));

        this.chartSetoresData = {
            labels,
            datasets: [
                {
                    label: 'Gravidade média por setor',
                    backgroundColor: cores,
                    borderColor: cores,
                    data: valores
                }
            ]
        };
    }

    private atualizarGrafico(): void {
        if (!this.resumo) {
            this.chartData = null;
            return;
        }

        const documentStyle = getComputedStyle(document.documentElement);
        const labels = this.resumo.topicos.map((t) => t.fator_risco);
        const valores = this.resumo.topicos.map((t) => t.gravidade_media);

        this.chartData = {
            labels,
            datasets: [
                {
                    label: 'Gravidade média por tópico',
                    backgroundColor: documentStyle.getPropertyValue('--primary-500') || '#3B82F6',
                    borderColor: documentStyle.getPropertyValue('--primary-500') || '#3B82F6',
                    data: valores
                }
            ]
        };

        // Atualiza as pizzas dependentes do resumo do setor filtrado.
        this.atualizarPizzas();
    }
}
