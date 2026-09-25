import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AcessoAplicacaoNr1Component } from './acesso-aplicacao-nr1.component';
import { AcessoAplicacaoNr1RoutingModule } from './acesso-aplicacao-nr1-routing.module';

@NgModule({
  declarations: [AcessoAplicacaoNr1Component],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AcessoAplicacaoNr1RoutingModule
  ]
})
export class AcessoAplicacaoNr1Module { }
