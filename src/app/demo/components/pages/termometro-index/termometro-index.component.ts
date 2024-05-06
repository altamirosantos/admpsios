import { Component } from '@angular/core';
import { TermometroService } from 'src/app/demo/service/termometro.service';

@Component({
  selector: 'app-termometro-index',
  standalone: false,
  templateUrl: './termometro-index.component.html',
  styleUrl: './termometro-index.component.scss'
})
export class TermometroIndexComponent {
    termometros:any[] = [];

    aconselhamentos:any[] = [];

    constructor(private termometroService: TermometroService){
    }

    ngOnInit(){
        this.termometroService.findAll({}).subscribe((retorno:any) => {
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
}
