import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { PerguntasService } from 'src/app/demo/service/perguntas.service';
import { RespostasService } from 'src/app/demo/service/respostas.service';

@Component({
    selector: 'app-termometro-index',
    standalone: false,
    templateUrl: './pergunta-index.component.html',
    styleUrl: './pergunta-index.component.scss',
    providers: [MessageService]
})
export class PerguntaIndexComponent {
    perguntas: any[] = [];

    respostas: any[] = [];


    perguntaDialog: boolean = false;
    deleteItemDialog: boolean = false;
    respostaDialog: boolean = false;

    pergunta: any = {};
    resposta: any = {};

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
        private perguntasService: PerguntasService,
        private respostasService: RespostasService) {
    }

    async ngOnInit() {
        this.loading = true;
        this.perguntas = await this.perguntasService.getAll();
        console.log(this.perguntas);
        this.loading = false;
    }

    saveTermometro() {
        // this.modalDialog = false;
    }

    hideTermometroDialog() {
        //  this.modalDialog = false;
    }

    editTermometro(pergunta) {
        //   console.log('edit >> ', pergunta);
        //  this.pergunta = pergunta;
        //  this.modalDialog = true;
    }

    async selectPergunta(pergunta) {
        this.loadingResp = true;
        console.log('select >> ', pergunta);
        //this.selectedPergunta = pergunta;
        this.respostas = await this.respostasService.getByPerguntaId(pergunta.id);
        this.loadingResp = false;
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
        this.resposta = item;
        this.respostaDialog = true;
    }

    deleteItem(item: any) {
        //  this.aconselhamento = item;
        //  this.deleteItemDialog = true;

    }

    confirmDeleteItem() {
        this.deleteItemDialog = false;
    }

    hideRespostaDialog() {
        this.respostaDialog = false;
    }

    saveResposta() {
        console.log('resposta >> ', this.resposta);
        this.respostasService.update(this.resposta.id, { devolutiva: this.resposta.devolutiva, sugestao: this.resposta.sugestao });
        this.respostaDialog = false;
    }

    onBasicUpload() {
        this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded with Basic Mode' });
    }

    myUploader(event) {
        console.log(event);
    }
}
