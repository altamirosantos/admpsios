import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PerguntaNr1IndexComponent } from './pergunta-nr1-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: PerguntaNr1IndexComponent }
    ])],
    exports: [RouterModule]
})
export class PerguntaNr1IndexRoutingModule { }
