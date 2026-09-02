import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FilialIndexComponent } from './filial-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: FilialIndexComponent }
    ])],
    exports: [RouterModule]
})
export class FilialIndexRoutingModule { }
