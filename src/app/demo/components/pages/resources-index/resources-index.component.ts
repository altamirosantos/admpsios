import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ResourcesService } from 'src/app/demo/service/resources.service';

@Component({
    selector: 'app-termometro-index',
    standalone: false,
    templateUrl: './resources-index.component.html',
    styleUrl: './resources-index.component.scss',
    providers: [MessageService]
})
export class ResourcesIndexComponent {
    autoavaliacoes: any[] = [];

    perguntaDialog: boolean = false;
    deleteItemDialog: boolean = false;
    //respostaDialog: boolean = false;

    autoavaliacao: any = {};
    //resposta: any = {};

    selectedPergunta: any = null;

    loading: boolean = false;

    loadingResp: boolean = false;

    perguntaSelecionada: any = null;

    onRowSelect(event: any) {
        console.log("Linha selecionada:", event.data);
    }
    onRowClick(event: any) {
        console.log("Linha clkickada:", event.data);
    }
    constructor(private messageService: MessageService,
        private resourcesService: ResourcesService) {
    }

    async ngOnInit() {
        this.loading = true;
        this.autoavaliacoes = await this.resourcesService.getAll();
        console.log(this.autoavaliacoes);
        this.loading = false;
    }

    saveTermometro() {
        // this.modalDialog = false;
    }

    hideDevolutivaDialog() {
        this.perguntaDialog = false;
    }

    jsonParaTexto(obj: any, indent = 0): string {
        const pad = ' '.repeat(indent);
        const linhas: string[] = [];

        Object.entries(obj ?? {}).forEach(([chave, valor]) => {
            const rotulo = this.labelizar(chave);

            if (valor === null || valor === undefined || valor === '') {
                linhas.push(`${pad}${rotulo}: —`);
            } else if (Array.isArray(valor)) {
                if (valor.length === 0) {
                    linhas.push(`${pad}${rotulo}: (vazio)`);
                } else if (valor.every(v => typeof v !== 'object')) {
                    // array de primitivos
                    linhas.push(`${pad}${rotulo}: ${valor.join(', ')}`);
                } else {
                    // array com objetos
                    linhas.push(`${pad}${rotulo}:`);
                    valor.forEach((item, i) => {
                        if (typeof item === 'object' && item !== null) {
                            linhas.push(`${pad}- Item ${i + 1}:`);
                            linhas.push(this.jsonParaTexto(item, indent + 2));
                        } else {
                            linhas.push(`${pad}- ${item}`);
                        }
                    });
                }
            } else if (typeof valor === 'object') {
                // objeto aninhado
                linhas.push(`${pad}${rotulo}:`);
                linhas.push(this.jsonParaTexto(valor, indent + 2));
            } else {
                // primitivo
                linhas.push(`${pad}${rotulo}: ${valor}`);
            }
        });

        return linhas.join('\n');
    }

    // Transforma "dados_entrada", "camelCase" etc. em rótulos legíveis
    private labelizar(chave: string): string {
        const espacado = chave
            .replace(/[_\-]+/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .toLowerCase();
        return espacado.charAt(0).toUpperCase() + espacado.slice(1);
    }

    // Getter para exibir no template
    getTextoFormatado(text: any): string {
        return this.jsonParaTexto(this.autoavaliacao.dados_entrada);
    }

    async editDevolutiva(autoavaliacao) {
        console.log('edit >> ', autoavaliacao);
        this.autoavaliacao = autoavaliacao;
        console.log(JSON.stringify(this.autoavaliacao.dados_entrada));
        this.autoavaliacao.dados_entrada = await this.getTextoFormatado(this.autoavaliacao.dados_entrada);
        this.perguntaDialog = true;
    }

    async selectPergunta(pergunta) {
        this.loadingResp = true;
        console.log('select >> ', pergunta);
        //this.selectedPergunta = pergunta;
        //  this.respostas = await this.respostasService.getByPerguntaId(pergunta.id);
        // this.loadingResp = false;
    }

    addItem() {
        /*    const a = [
           'Ter mais pensamentos positivos',
        'Reduzir a ansiedade e o estresse',
        'Me sentir mais confiante',
        'Ter mais equilíbrio nas emoções',
        'Me sentir mais valorizado(a)'
            ];
            const perguntaID = 'eb8aa924-56ce-481b-93f1-60ae02b09515';
            for (let i = 0; i < a.length; i++) {
                this.respostasService.create({ descricao: a[i], devolutiva: null, pergunta_id: perguntaID });
            }*/
    }

    editItem(item) {
        console.log('edit item>> ', item)
        // this.resposta = item;
        // this.respostaDialog = true;
    }

    deleteItem(item: any) {
        //  this.aconselhamento = item;
        //  this.deleteItemDialog = true;

    }

    confirmDeleteItem() {
        this.deleteItemDialog = false;
    }

    hideRespostaDialog() {
        // this.respostaDialog = false;
    }

    saveResposta() {
        // console.log('resposta >> ', this.resposta);
        // this.respostasService.update(this.resposta.id, { devolutiva: this.resposta.devolutiva, sugestao: this.resposta.sugestao });
        // this.respostaDialog = false;
    }

    onBasicUpload() {
        this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded with Basic Mode' });
    }

    myUploader(event) {
        console.log(event);
    }
}
