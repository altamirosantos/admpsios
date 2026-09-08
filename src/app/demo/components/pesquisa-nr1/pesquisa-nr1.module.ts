import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PesquisaNr1RoutingModule } from './pesquisa-nr1-routing.module';
import { PesquisaNr1Component } from './pesquisa-nr1.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        PesquisaNr1RoutingModule
    ],
    declarations: [PesquisaNr1Component]
})
export class PesquisaNr1Module { }
