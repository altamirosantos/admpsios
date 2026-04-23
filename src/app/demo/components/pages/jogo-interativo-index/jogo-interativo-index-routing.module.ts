import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { JogoInterativoIndexComponent } from './jogo-interativo-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: JogoInterativoIndexComponent }
    ])],
    exports: [RouterModule]
})
export class JogoInterativoIndexRoutingModule { }
