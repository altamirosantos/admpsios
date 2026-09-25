import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AcessoAplicacaoNr1Component } from './acesso-aplicacao-nr1.component';

const routes: Routes = [
  {
    path: ':aplicacao_nr1_id',
    component: AcessoAplicacaoNr1Component
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AcessoAplicacaoNr1RoutingModule { }
