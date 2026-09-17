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
import { SupabaseService } from 'src/app/demo/service/supabase.service';

interface SelectOption {
    label: string;
    value: string;
}

/** Resultado retornado pela edge function n8n-laudonr1. */
interface LaudoNr1Resultado {
    laudo_tecnico: string;
    plano_de_acao: Record<string, any>[];
    conclusao: string;
}

interface LaudoNr1RegistroSetor {
    setor_id: string;
    setor_label: string;
    contexto: string;
    resultado: LaudoNr1Resultado;
    updated_at: string;
}

interface AplicacaoDadosRelatorio {
    setores: Record<string, LaudoNr1RegistroSetor>;
    [key: string]: unknown;
}

/** Paleta fixa por classificação (verde/amarelo/vermelho/preto). */
const COR_BAIXO = '#22c55e';   // verde
const COR_MEDIO = '#eab308';   // amarelo
const COR_ALTO = '#ef4444';    // vermelho
const COR_CRITICO = '#111827'; // preto
const COR_PENDENTE = '#9ca3af'; // cinza

/**
 * Fontes geradoras do risco — textos FIXOS por fator de risco (fonte: planilha /
 * fontes-geradoras.csv). A chave é o nome do tópico SEM o prefixo "Tópico NN - ".
 */
const FONTES_GERADORAS: Record<string, string> = {
    'Assédio de qualquer natureza no trabalho':
        'Cultura permissiva a desrespeito; ausência de canal de denúncia; liderança despreparada; comunicação violenta.',
    'Falta de suporte/apoio no trabalho':
        'Liderança ausente; falta de escuta; cobrança sem acompanhamento; RH pouco atuante.',
    'Má gestão de mudanças organizacionais':
        'Comunicação inadequada; mudanças abruptas; falta de planejamento; insegurança quanto à estabilidade.',
    'Baixa clareza de papel/função':
        'Falta de definição de responsabilidades; ordens contraditórias; comunicação confusa; atribuições mal definidas.',
    'Baixas recompensas e reconhecimento':
        'Ausência de feedback; foco exclusivo em metas; reconhecimento desigual; falta de plano de crescimento.',
    'Baixo controle no trabalho / Falta de autonomia':
        'Microgestão; excesso de burocracia; centralização de decisões; baixa confiança na equipe.',
    'Baixa justiça organizacional':
        'Critérios pouco transparentes; favorecimento; desigualdade de tratamento; decisões pouco claras.',
    'Eventos violentos ou traumáticos':
        'Falta de protocolos de segurança; exposição a risco; ausência de treinamento; falta de suporte pós-evento.',
    'Baixa demanda no trabalho (Subcarga)':
        'Subutilização de competências; ociosidade; má distribuição de tarefas; funções pouco desafiadoras.',
    'Excesso de demandas no trabalho (Sobrecarga)':
        'Metas irrealistas; equipe insuficiente; jornadas prolongadas; acúmulo de funções.',
    'Maus relacionamentos no local de trabalho':
        'Comunicação agressiva; rivalidade interna; conflitos mal geridos; liderança despreparada.',
    'Trabalho em condições de difícil comunicação':
        'Turnos desalinhados; distância física; falha nos meios de comunicação; fluxo de informação inadequado.',
    'Trabalho remoto e isolado':
        'Isolamento social; falta de acompanhamento; comunicação exclusivamente digital; baixa integração da equipe.'
};

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

    /** Texto livre do elaborador — campo "Contexto" do card "Análise do Elaborador". */
    contextoAnalise: string = '';

    /** Estado e resultado da geração do laudo por IA. */
    gerandoLaudo = false;
    salvandoDadosRelatorio = false;
    laudoResultado: LaudoNr1Resultado | null = null;
    planoDeAcaoColunas: string[] = [];

    private aplicacoes: AplicacaoNr1[] = [];

    constructor(
        private readonly messageService: MessageService,
        private readonly aplicacaoService: AplicacaoNr1Service,
        private readonly metricasService: MetricasNr1Service,
        private readonly supabaseService: SupabaseService
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
        this.limparDadosRelatorioTela();
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
        this.sincronizarDadosRelatorioDoSetor();
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

    /**
     * Retorna a fonte geradora (texto fixo) do fator de risco. Casa pelo nome do
     * tópico, removendo o prefixo "Tópico NN - " quando presente.
     */
    fonteGeradora(fatorRisco: string): string {
        if (!fatorRisco) {
            return '';
        }
        // Match direto ou removendo o prefixo "Tópico NN - ".
        const semPrefixo = fatorRisco.replace(/^T[óo]pico\s*\d+\s*-\s*/i, '').trim();
        return FONTES_GERADORAS[fatorRisco] ?? FONTES_GERADORAS[semPrefixo] ?? '';
    }

    /** Gera o PDF/impressão do quadro atual (o psicólogo salva por setor). */
    exportarPdf(): void {
        window.print();
    }

    /** Chama a edge function n8n-laudonr1 para gerar o laudo técnico via IA. */
    async gerarLaudoIA(): Promise<void> {
        if (!this.podeGerarLaudoIA || !this.resumo) {
            return;
        }

        this.gerandoLaudo = true;
        this.laudoResultado = null;
        this.planoDeAcaoColunas = [];

        try {
            const topicos = this.resumo.topicos.map((t, i) => ({
                topico_id: String(i + 1).padStart(2, '0'),
                topico_nome: t.fator_risco,
                risco_final: t.risco_classe
            }));

            const payload = {
                setor: this.setorSelecionadoLabel,
                topicos,
                contexto: this.contextoAnalise || 'Analise conforme resultados dos topicos.'
            };

            const { data, error } = await this.supabaseService.client.functions.invoke('n8n-laudonr1', {
                body: payload
            });

            if (error) {
                throw error;
            }

            const resultado = (typeof data === 'string' ? JSON.parse(data) : data) as LaudoNr1Resultado;
            this.laudoResultado = resultado;
            this.atualizarColunasPlanoDeAcao();
            await this.persistirDadosRelatorio();

            this.messageService.add({
                severity: 'success',
                summary: 'Laudo gerado',
                detail: 'O laudo técnico foi gerado e salvo com sucesso para o setor selecionado.',
                life: 4000
            });
        } catch (error) {
            console.error('Erro ao gerar laudo por IA:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível gerar o laudo. Tente novamente.',
                life: 5000
            });
        } finally {
            this.gerandoLaudo = false;
        }
    }

    async salvarDadosRelatorioEditados(): Promise<void> {
        if (!this.podeEditarAnaliseSetor || !this.laudoResultado) {
            return;
        }

        this.salvandoDadosRelatorio = true;

        try {
            await this.persistirDadosRelatorio();
            this.messageService.add({
                severity: 'success',
                summary: 'Dados salvos',
                detail: 'As alterações do laudo foram salvas com sucesso.',
                life: 4000
            });
        } catch (error) {
            console.error('Erro ao salvar dados do laudo:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível salvar as alterações do laudo.',
                life: 5000
            });
        } finally {
            this.salvandoDadosRelatorio = false;
        }
    }

    atualizarPlanoAcaoCampo(item: Record<string, any>, coluna: string, valor: any): void {
        item[coluna] = valor;
    }

    // --- Helpers de exibição ---

    get podeEditarAnaliseSetor(): boolean {
        return !!this.aplicacaoSelecionadaId && !!this.setorSelecionadoId;
    }

    get podeGerarLaudoIA(): boolean {
        return this.podeEditarAnaliseSetor
            && !!this.resumo
            && this.resumo.topicos.length > 0
            && this.resumo.topicos.every((topico) => topico.risco_classe !== 'Pendente');
    }

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

    private sincronizarDadosRelatorioDoSetor(): void {
        if (!this.podeEditarAnaliseSetor) {
            this.limparDadosRelatorioTela();
            return;
        }

        const registro = this.obterRegistroDadosRelatorioSetor();
        if (!registro) {
            this.limparDadosRelatorioTela();
            return;
        }

        this.contextoAnalise = registro.contexto || '';
        this.laudoResultado = this.clonarLaudo(registro.resultado);
        this.atualizarColunasPlanoDeAcao();
    }

    private async persistirDadosRelatorio(): Promise<void> {
        if (!this.aplicacaoSelecionadaId || !this.setorSelecionadoId || !this.laudoResultado) {
            return;
        }

        const dadosRelatorio = this.normalizarDadosRelatorio(this.aplicacaoSelecionada?.dados_relatorio);
        dadosRelatorio.setores[this.setorSelecionadoId] = {
            setor_id: this.setorSelecionadoId,
            setor_label: this.setorSelecionadoLabel,
            contexto: this.contextoAnalise || '',
            resultado: this.clonarLaudo(this.laudoResultado),
            updated_at: new Date().toISOString()
        };

        await this.aplicacaoService.atualizarDadosRelatorio(this.aplicacaoSelecionadaId, dadosRelatorio);
        this.atualizarAplicacaoLocal(dadosRelatorio);
    }

    private atualizarAplicacaoLocal(dadosRelatorio: AplicacaoDadosRelatorio): void {
        if (!this.aplicacaoSelecionadaId) {
            return;
        }

        this.aplicacoes = this.aplicacoes.map((aplicacao) =>
            aplicacao.id === this.aplicacaoSelecionadaId ? { ...aplicacao, dados_relatorio: dadosRelatorio } : aplicacao
        );
        this.aplicacaoSelecionada = this.aplicacoes.find((aplicacao) => aplicacao.id === this.aplicacaoSelecionadaId) ?? this.aplicacaoSelecionada;
    }

    private obterRegistroDadosRelatorioSetor(): LaudoNr1RegistroSetor | null {
        if (!this.setorSelecionadoId) {
            return null;
        }

        const dadosRelatorio = this.normalizarDadosRelatorio(this.aplicacaoSelecionada?.dados_relatorio);
        const registro = dadosRelatorio.setores[this.setorSelecionadoId];
        return registro?.resultado ? registro : null;
    }

    private normalizarDadosRelatorio(dados: unknown): AplicacaoDadosRelatorio {
        if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
            return { setores: {} };
        }

        const dadosObjeto = dados as Record<string, unknown>;
        const setores = dadosObjeto['setores'];

        return {
            ...dadosObjeto,
            setores: setores && typeof setores === 'object' && !Array.isArray(setores)
                ? { ...(setores as Record<string, LaudoNr1RegistroSetor>) }
                : {}
        };
    }

    private limparDadosRelatorioTela(): void {
        this.contextoAnalise = '';
        this.laudoResultado = null;
        this.planoDeAcaoColunas = [];
    }

    private atualizarColunasPlanoDeAcao(): void {
        this.planoDeAcaoColunas = this.laudoResultado?.plano_de_acao?.length
            ? Object.keys(this.laudoResultado.plano_de_acao[0])
            : [];
    }

    private clonarLaudo(resultado: LaudoNr1Resultado): LaudoNr1Resultado {
        return JSON.parse(JSON.stringify(resultado)) as LaudoNr1Resultado;
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
