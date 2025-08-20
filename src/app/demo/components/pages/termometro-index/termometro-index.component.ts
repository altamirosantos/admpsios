import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TermometroService } from 'src/app/demo/service/termometro.service';

@Component({
    selector: 'app-termometro-index',
    standalone: false,
    templateUrl: './termometro-index.component.html',
    styleUrl: './termometro-index.component.scss',
    providers: [MessageService]
})
export class TermometroIndexComponent {
    termometros: any[] = [];

    aconselhamentos: any[] = [];

    termometroDialog: boolean = false;
    deleteItemDialog: boolean = false;
    aconselhamentotDialog: boolean = false;

    termometro: any = {};
    aconselhamento: any = {};

    constructor(private termometroService: TermometroService, private messageService: MessageService) {
    }

    ngOnInit() {
        this.termometroService.findAll({}).subscribe((retorno: any) => {
            console.log(retorno);
            this.termometros = retorno.rows;
        })
        /*this.termometros = [{
            id: '1',
            nome: 'Nivel 1',
            image_url: 'nivel 1',
        },{
            id: '2',
            nome: 'Nivel 2',
            image_url: 'nivel 2',
        },{
            id: '3',
            nome: 'Nivel 3',
            image_url: 'nivel 3',
        }]*/
    }

    saveTermometro() {
        this.termometroDialog = false;
    }

    hideTermometroDialog() {
        this.termometroDialog = false;
    }

    editTermometro(termometro) {
        console.log('edit >> ', termometro);
        this.termometro = termometro;
        this.termometroDialog = true;
    }

    selectTermometro(termometro) {
        console.log('select >> ', termometro);
        this.termometroService.findItemTermometroAll(termometro.id).subscribe((retorno: any) => {
            console.log("Item>> ", retorno);
            this.aconselhamentos = retorno.rows;
        })
    }

    addItem(){
        this.aconselhamento = {};
        this.aconselhamentotDialog = true;
    }

    editItem(item) {
        console.log('edit item>> ', item)
        this.aconselhamento = item;
        this.aconselhamentotDialog = true;
    }

    deleteItem(item: any) {
        this.aconselhamento = item;
        this.deleteItemDialog = true;

    }

    confirmDeleteItem() {
        this.deleteItemDialog = false;
    }

    hideAconselhamentoDialog() {
        this.aconselhamentotDialog = false;
    }

    saveAconselhamento() {
        this.aconselhamentotDialog = false;
    }

    onBasicUpload() {
        this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded with Basic Mode' });
    }

    myUploader(event){
        console.log(event);
    }
}
