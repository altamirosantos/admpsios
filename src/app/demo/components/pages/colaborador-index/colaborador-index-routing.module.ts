import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ColaboradorIndexComponent } from './colaborador-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: ColaboradorIndexComponent }
    ])],
    exports: [RouterModule]
})
export class ColaboradorIndexRoutingModule { }
