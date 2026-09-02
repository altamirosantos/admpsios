import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EmpresaIndexComponent } from './empresa-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: EmpresaIndexComponent }
    ])],
    exports: [RouterModule]
})
export class EmpresaIndexRoutingModule { }
