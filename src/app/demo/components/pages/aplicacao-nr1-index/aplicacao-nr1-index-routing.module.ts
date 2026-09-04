import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AplicacaoNr1IndexComponent } from './aplicacao-nr1-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: AplicacaoNr1IndexComponent }
    ])],
    exports: [RouterModule]
})
export class AplicacaoNr1IndexRoutingModule { }
