import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SetorIndexComponent } from './setor-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: SetorIndexComponent }
    ])],
    exports: [RouterModule]
})
export class SetorIndexRoutingModule { }
