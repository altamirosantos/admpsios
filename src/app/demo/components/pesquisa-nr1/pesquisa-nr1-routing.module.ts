import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PesquisaNr1Component } from './pesquisa-nr1.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: ':token', component: PesquisaNr1Component }
    ])],
    exports: [RouterModule]
})
export class PesquisaNr1RoutingModule { }
