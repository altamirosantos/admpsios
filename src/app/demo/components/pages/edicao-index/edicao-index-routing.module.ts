import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EdicaoIndexComponent } from './edicao-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: EdicaoIndexComponent }
    ])],
    exports: [RouterModule]
})
export class EdicaoIndexRoutingModule { }
