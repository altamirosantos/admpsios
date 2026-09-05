import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContratoEmpresaIndexComponent } from './contrato-empresa-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: ContratoEmpresaIndexComponent }
    ])],
    exports: [RouterModule]
})
export class ContratoEmpresaIndexRoutingModule { }
