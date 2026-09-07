import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AplicacaoNr1, AplicacaoNr1Service } from 'src/app/demo/service/aplicacao-nr1.service';
import {
    MetricaFatorRisco,
    MetricasNr1Service,
    ResumoMetricasNr1,
    RiscoClasse
} from 'src/app/demo/service/metricas-nr1.service';

interface SelectOption {
    label: string;
    value: string;
}

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

    loadingAplicacoes = false;
    loadingMetricas = false;
    /** Guarda qual tópico está com probabilidade sendo salva (para desabilitar o dropdown). */
    salvandoProbabilidade: string | null = null;

    readonly probabilidadeOptions = PROBABILIDADE_OPTIONS;

    // Dados do gráfico (gravidade média por tópico)
    chartData: any;
    chartOptions: any;

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
        this.aplicacaoSelecionada = this.aplicacoes.find((a) => a.id === this.aplicacaoSelecionadaId) ?? null;

        if (!this.aplicacaoSelecionadaId) {
            return;
        }

        await this.carregarMetricas();
    }

    async carregarMetricas(): Promise<void> {
        if (!this.aplicacaoSelecionadaId) {
            return;
        }

        this.loadingMetricas = true;

        try {
            this.resumo = await this.metricasService.calcularMetricas(this.aplicacaoSelecionadaId);
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
            await this.metricasService.salvarProbabilidade(this.aplicacaoSelecionadaId, topico.fator_risco, probabilidade);
            // Recalcula para refletir a matriz de risco atualizada.
            await this.carregarMetricas();
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

    /** Severity do PrimeNG tag conforme a classe de risco final. */
    riscoSeverity(classe: RiscoClasse): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
        const map: Record<RiscoClasse, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
            Baixo: 'success',
            Médio: 'info',
            Alto: 'warning',
            Crítico: 'danger',
            Pendente: 'secondary'
        };
        return map[classe] ?? 'secondary';
    }

    /** Severity para a classe de gravidade (Baixa/Média/Alta). */
    nivelSeverity(classe: string | null): 'success' | 'warning' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
            Baixa: 'success',
            Média: 'warning',
            Alta: 'danger'
        };
        return (classe && map[classe]) || 'secondary';
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
    }
}
