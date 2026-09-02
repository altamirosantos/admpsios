import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PropostaEmpresaIndexComponent } from './proposta-empresa-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: PropostaEmpresaIndexComponent }
    ])],
    exports: [RouterModule]
})
export class PropostaEmpresaIndexRoutingModule { }
