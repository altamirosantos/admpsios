import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ServicosPropostaIndexComponent } from './servicos-proposta-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: ServicosPropostaIndexComponent }
    ])],
    exports: [RouterModule]
})
export class ServicosPropostaIndexRoutingModule { }
