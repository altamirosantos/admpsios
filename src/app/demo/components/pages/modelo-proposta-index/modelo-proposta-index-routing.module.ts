import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ModeloPropostaIndexComponent } from './modelo-proposta-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: ModeloPropostaIndexComponent }
    ])],
    exports: [RouterModule]
})
export class ModeloPropostaIndexRoutingModule { }
